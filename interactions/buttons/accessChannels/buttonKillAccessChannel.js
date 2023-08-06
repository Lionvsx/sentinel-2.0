const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const DiscordLogger = require('../../../utils/services/discordLoggerService')
const { Permissions, MessageEmbed } = require('discord.js')

module.exports = class AccessCategoryButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonKillAccessChannel', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.KICK_MEMBERS],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        const embed = new MessageEmbed()
            .setDescription(`<:x_:1137419292946727042> Accès supprimé par \`\`${interaction.user.tag}\`\``)
            .setColor('2b2d31')

        interaction.update({
            embeds: [embed],
            components: []
        })
        ticketLogger.info(`Accès à un ticket fermé par <@!${interaction.user.id}>`)
    }
}