const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const {Permissions } = require('discord.js')
const { updateGuildMemberCache, chunkArray } = require('../../../../utils/functions/utilitaryFunctions')
const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const mongoose = require('mongoose');
const {deletePage, updateUserPage, getNotionPageById, restorePage} = require("../../../../utils/functions/notionFunctions");

module.exports = class SyncDatabaseButton extends BaseInteraction {
    constructor() {
        super('buttonSyncDatabase', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()

        const envLogger = new DiscordLogger('environnement', '#00cec9')
        envLogger.setGuild(interaction.guild)
        envLogger.setLogMember(interaction.member)

        const loading = client.emojis.cache.get('741276138319380583')

        const dmChannel = await interaction.user.createDM()

        const allMembers = await updateGuildMemberCache(interaction.guild)
        const messages = []

        let msg = await dmChannel.send(`**${loading} | **Syncing database...`)

        const Users = await mongoose.model('User').find({ onServer: true });

        for (const [, member] of allMembers) {
            const existingDBUser = await mongoose.model('User').findOne({ discordId: member.user.id })

            if (existingDBUser && existingDBUser.id) {
                if (existingDBUser.username !== member.user.username) {
                    existingDBUser.username = member.user.username
                    await existingDBUser.save()
                }
                let notionUpdate = false
                if (existingDBUser.userTag !== member.user.tag) {
                    existingDBUser.userTag = member.user.tag
                    await existingDBUser.save()
                    notionUpdate = true
                    messages.push(`**<:info:1137425479914242178> | **Discord tag mis à jour pour :  \`${member.user.username}\``)
                }
                if (existingDBUser.avatarURL !== member.user.displayAvatarURL()) {
                    existingDBUser.avatarURL = member.user.displayAvatarURL()
                    await existingDBUser.save()
                    notionUpdate = true
                    messages.push(`**<:info:1137425479914242178> | **Discord avatar mis à jour pour :  \`${member.user.username}\``)
                }

                if (existingDBUser.isOnNotion && existingDBUser.linkedNotionPageId) {
                    // Check if notion page still exists
                    try {
                        let page = await getNotionPageById(existingDBUser.linkedNotionPageId)
                        if (page.archived) await restorePage(existingDBUser.linkedNotionPageId)
                    } catch (e) {
                        this.error(`Page has been deleted for member ${existingDBUser.username} on notion`)
                        messages.push(`**<:alerttriangleyellow:1137390607069888593> | **La page Notion de \`${existingDBUser.username}\` a été supprimée, vous devrez lui redemander ses infos`)
                        existingDBUser.isOnNotion = false
                        existingDBUser.linkedNotionPageId = undefined
                        existingDBUser.firstName = undefined
                        existingDBUser.lastName = undefined
                        existingDBUser.school = undefined
                        existingDBUser.schoolYear = undefined
                        existingDBUser.roleResponsable = undefined
                        existingDBUser.isResponsable = false
                        existingDBUser.isBureau = false
                        await existingDBUser.save()
                    }
                }

                if (existingDBUser.isOnNotion && existingDBUser.linkedNotionPageId && notionUpdate) {
                    await updateUserPage(existingDBUser.linkedNotionPageId, {
                        discordTag: member.user.tag,
                        avatarURL: member.user.displayAvatarURL(),
                    })
                    this.log("Notion config updated for " + existingDBUser.username)
                    messages.push(`**<:info:1137425479914242178> | **Notion page mise à jour pour :  \`${member.user.username}\``)
                }

            } else {
                try {
                    await mongoose.model('User').create({
                        username: member.user.username,
                        discordId: member.user.id,
                        avatarURL: member.user.displayAvatarURL(),
                        userTag: member.user.tag,
                        onServer: true
                    })
                } catch (err) {
                    console.error(err)
                }
                messages.push(`**<:info:1137425479914242178> | **Nouvelle entrée dans la DB :  \`${member.user.username}\``)
            }
        }
        for (const user of Users) {
            let linkedGuildMember = await allMembers.get(user.discordId)
    
            if (!linkedGuildMember) {
                user.isMember = false
                user.isResponsable = false
                user.isBureau = false
                user.roleResponsable = undefined
                user.school = undefined
                user.schoolYear = undefined
                user.roles = undefined

                if (user.isOnNotion && user.linkedNotionPageId) {
                    try {
                        await deletePage(user.linkedNotionPageId)
                    } catch (e) {
                        this.error(`Page has already been deleted for ${user.username} on notion`)
                        messages.push(`**<:x_:1137419292946727042> | **La page Notion de \`${user.username}\` a déjà été supprimée !`)
                    }
                    user.isOnNotion = false
                    user.linkedNotionPageId = undefined
                    this.log("Notion config removed for " + user.username)
                }
                this.log(`${user.username} => User removed from DB : left the server`)
                user.onServer = false
                await user.save()
                messages.push(`**<:x_:1137419292946727042> | **L'utilisateur \`${user.username}\` a quitté le serveur, entrée effacée dans la DB !`)
            }
        }
    
        var sortstring = function (a, b) {
            a = a.toLowerCase();
            b = b.toLowerCase();
            if (a.startsWith('**<:info:1137425479914242178>') && b.startsWith('**<:x_:1137419292946727042>')) return -1
            if (a.startsWith('**<:info:1137425479914242178>') && b.startsWith('**<:alerttriangleyellow:1137390607069888593>')) return -1
            if (a.startsWith('**<:alerttriangleyellow:1137390607069888593>') && b.startsWith('**<:x_:1137419292946727042>')) return -1
            return 0;
        }
    
        messages.sort(sortstring)

        
        if (messages.length > 0) {
            await msg.edit('**<:alerttriangleyellow:1137390607069888593> | **Erreurs trouvées :')
            const messagesChunks = chunkArray(messages, 25)
            for (const chunk of messagesChunks) {
                await dmChannel.send({
                    content: chunk.join('\n')
                })
            }
            envLogger.warning(`Database update : \`${messages.length}\` fixed !`)
        } else {
            await msg.edit(`**<:check:1137390614296678421> | **Configuration correcte !`)
            envLogger.info(`Database update : \`${messages.length}\` users updated : config up to date !`)
        }
    }
}