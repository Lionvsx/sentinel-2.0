const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const DiscordLogger = require('../../../utils/services/discordLoggerService')
const { MessageEmbed } = require('discord.js')

module.exports = class AccessChannelButton extends BaseInteraction {
    constructor() {
        super('buttonAccessChannel', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return
        const allChannels = interaction.guild.channels.cache;
        const accessChannel = allChannels.get(buttonArgs[1]);

        const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        if (!accessChannel) {
            const embed = new MessageEmbed()
                .setDescription("Ce ticket n'existe plus !")
                .setColor('2b2d31')

            interaction.update({
                embeds: [embed],
                components: []
            })
            return;
        }

        try {
            await accessChannel.permissionOverwrites.create(interaction.user, {
                SEND_MESSAGES: true,
                VIEW_CHANNEL: true
            })
            await ticketLogger.info(`<@!${interaction.user.id}> a accédé au ticket \`${accessChannel.name}\``)
            accessChannel.send({
                content: `**<:arrowrightcircle:1137421115766083726> | **\`${interaction.user.username}\` a rejoint le ticket !`
            })
            interaction.reply({
                content: `<:checksquare:1137390612543459398> Accès autorisé au ticket <#${accessChannel.id}>`,
                ephemeral: true
            })
        } catch (err) {
            console.log(err)
            await ticketLogger.error(`<@!${interaction.user.id}> n'a pas pu accéder au ticket avec l'id \`${buttonArgs[1]}\``)
        }
    }
}