const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { Permissions, MessageEmbed } = require('discord.js')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const mongoose = require('mongoose');
const {deletePage} = require("../../../../utils/functions/notionFunctions");
const DiscordLogger = require('../../../../utils/services/discordLoggerService')

module.exports = class NukeServerButton extends BaseInteraction {
    constructor() {
        super('buttonNukeServer', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()

        const loading = client.emojis.cache.get('741276138319380583')

        const dmChannel = await interaction.user.createDM()

        const envLogger = new DiscordLogger('environnement', '#00cec9')
        envLogger.setGuild(interaction.guild)
        envLogger.setLogMember(interaction.member)

        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache
        const memberToNuke = allMembers.filter(m => m.bannable && !m.user.bot && !m.roles.cache.has("676812746519609344"))

        const confirmation = await askForConfirmation(dmChannel, `Vous voulez vraiment reset tout les rôles des membres du serveur ${interaction.guild.name} ?`).catch(err => console.log(err))
        if (!confirmation) return;


        let msg = await dmChannel.send(`**${loading} | **Nuking members...`)
        let count = 0

        for (const [id, member] of memberToNuke.entries()) {
            let roles = member.roles

            let rolesToRemove = roles.cache.filter(role => role.rawPosition < allRoles.get('742810872044322918').rawPosition && role.rawPosition > allRoles.get('624713487112732673').rawPosition || role.rawPosition < allRoles.get('676798588034220052').rawPosition && role.rawPosition > allRoles.get('642769397525774336').rawPosition)

            const User = await mongoose.model('User').findOne({ discordId: member.user.id })

            count++;

            if (User && User.id && (User.isMember || User.isResponsable)) {
                User.isMember = false
                User.isResponsable = false
                User.isBureau = false
                User.roleResponsable = undefined
                User.school = undefined
                User.schoolYear = undefined
                User.roles = undefined

                if (User.isOnNotion && User.linkedNotionPageId) {
                    await deletePage(User.linkedNotionPageId)
                    User.isOnNotion = false
                    User.linkedNotionPageId = undefined
                    this.log("Notion config nuked for " + member.user.username)
                }
                await User.save();
                this.log(`${member.user.username} => DB Config Nuked!`)
            } else {
                this.log(`${member.user.username} => Config OK!`)
            }

            if (rolesToRemove.size > 0) {
                try {
                    await member.roles.remove(rolesToRemove)
                } catch (error) {
                    console.log(error)
                    continue;
                }
                this.log(`${member.user.username} => ${rolesToRemove.size} roles removed !`)
            }
            let percentage = Math.floor(count / memberToNuke.size * 100)
            let barProgress = Math.floor(percentage / 5)

            if (percentage % 5 === 0) {
                let bar = renderProgressBar(barProgress, 20)
                let embed = new MessageEmbed()
                    .setDescription(`**${loading} | **Nuking members...\n\`\`\`${bar} ${percentage}% | ${count}/${memberToNuke.size}\`\`\``)
                    .setColor('2b2d31')
                await msg.edit({
                    embeds: [embed],
                    content: ` `
                })
            }
        }
        await msg.delete()
        let embed = new MessageEmbed()
            .setColor('2b2d31')
            .setDescription(`**<:check:1137390614296678421> | **Members nuked !`)
        await dmChannel.send({
            embeds: [embed]
        })

        await envLogger.info(`**${interaction.member.user.username}** a nuke le serveur !`)
    }
}

function renderProgressBar(progress, size) {
    let bar = "";
    for (let i = 0; i < progress; i++) {
        bar += "█"
    }
    for (let i = 0; i < size - progress; i++) {
        bar += "▁"
    }
    return bar;
}