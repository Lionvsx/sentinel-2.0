const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageActionRow, MessageButton } = require('discord.js')

module.exports = class PingCommand extends BaseCommand {
    constructor() {
        super('ping', 'utilities', [], {
            usage: "ping",
            description: "Ping le bot",
            categoryDisplayName: `🔧 Utilities`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            hide: false,
            admin: false,
            home: false
        })
    }

    async run(client, message, args) {

        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('ping')
                .setLabel('Test')
                .setStyle('PRIMARY'),
        );

        message.channel.send({
            content: 'Test',
            components: [row]
        });
    }
}