const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { SlashCommandBuilder } = require('@discordjs/builders')

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
        await interaction.reply(`${loading} Pinging server ...`)

        interaction.editReply({ content: `Ping : ${Math.round(client.ws.ping)} ms`})
    }
}