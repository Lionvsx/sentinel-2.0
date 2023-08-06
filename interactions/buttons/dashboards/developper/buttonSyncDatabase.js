const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { MessageEmbed, Permissions } = require('discord.js')
const { updateGuildMemberCache, chunkArray } = require('../../../../utils/functions/utilitaryFunctions')
const DiscordLogger = require('../../../../utils/services/discordLoggerService')


const mongoose = require('mongoose');

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

        for (const [key, member] of allMembers) {
            const existingDBUser = await mongoose.model('User').findOne({ discordId: member.user.id })

            if (existingDBUser && existingDBUser.id) {
                if (existingDBUser.username != member.user.username) {
                    existingDBUser.username = member.user.username
                    await existingDBUser.save()
                    messages.push(`**<:alerttriangleyellow:1137390607069888593> | **Username mis à jour pour :  \`${member.user.username}\``)
                }
                if (existingDBUser.userTag != member.user.tag) {
                    existingDBUser.userTag = member.user.tag
                    await existingDBUser.save()
                    messages.push(`**<:alerttriangleyellow:1137390607069888593> | **Discord tag mis à jour pour :  \`${member.user.username}\``)
                }
                if (existingDBUser.avatarURL != member.user.displayAvatarURL()) {
                    existingDBUser.avatarURL = member.user.displayAvatarURL()
                    await existingDBUser.save()
                    messages.push(`**<:alerttriangleyellow:1137390607069888593> | **Discord avatar mis à jour pour :  \`${member.user.username}\``)
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
                messages.push(`**<:check:1137390614296678421> | **Nouvelle entrée dans la DB :  \`${member.user.username}\``)
            }
        }
        for (const user of Users) {
            let linkedGuildMember = await allMembers.get(user.discordId)
    
            if (!linkedGuildMember) {
                user.onServer = false
                await user.save()
                messages.push(`**<:x_:1137419292946727042> | **L'utilisateur \`${user.username}\` a quitté le serveur, entrée effacée dans la DB !`)
            }
        }
    
        var sortstring = function (a, b)    {
            a = a.toLowerCase();
            b = b.toLowerCase();
            if (a.startsWith('**<:check:1137390614296678421>') && b.startsWith('**<:x_:1137419292946727042>')) return -1
            if (a.startsWith('**<:check:1137390614296678421>') && b.startsWith('**<:alerttriangleyellow:1137390607069888593>')) return -1
            if (a.startsWith('**<:alerttriangleyellow:1137390607069888593>') && b.startsWith('**<:x_:1137419292946727042>')) return -1
            return 0;
        }
    
        messages.sort(sortstring)

        
        if (messages.length > 0) {
            await msg.edit('**<:alerttriangleyellow:1137390607069888593> | **Erreurs trouvées :')
            const messagesChunks = chunkArray(messages, 30)
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