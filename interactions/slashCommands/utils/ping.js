const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = class PingInteraction extends BaseInteraction {
    constructor() {
        super('ping', 'utilities', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Ping le bot')
        })
    }

    async run(client, interaction) {
        const loading = client.emojis.cache.get('741276138319380583')
        const message = await interaction.reply({
            content: `${loading} Pinging server ...`,
            fetchReply: true
        })

        let embed = new MessageEmbed()
            .setColor('#2ecc71')
            .addFields([
                {name: 'Ping', value: `\`${Math.abs(interaction.createdTimestamp - message.createdTimestamp)} ms\``, inline: true},
                {name: 'API Latency', value: `\`${Math.round(client.ws.ping)} ms\``, inline: true}
            ])

        interaction.editReply({ content: ` `, embeds: [embed]})
    }
}