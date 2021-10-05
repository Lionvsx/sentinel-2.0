const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createMessageActionRow,
    createSelectionMenu,
    createSelectionMenuOption
} = require('../../utils/functions/messageComponents');

const { MessageEmbed } = require('discord.js');

module.exports = class TestCommand extends BaseCommand {
    constructor() {
        super('test', 'utilities', [], {
            usage: "test",
            description: "test le bot",
            categoryDisplayName: `🔧 Utilities`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            admin: false,
            home: false,
            serverOnly: false,
            subCommands: false
        })
    }

    async run(client, message, args) {
        const embed = new MessageEmbed().setTitle('Test')
        const row = createMessageActionRow([
            createSelectionMenu('test', 'Veuillez selectionner une option', [createSelectionMenuOption('testOption', 'TestOption', 'DescriptionTest'), createSelectionMenuOption('testOption2', 'TestEmoji', 'DescriptionTest', '🧡'), createSelectionMenuOption('testSSrienDD', 'Test sans rien')], 2, 2)
        ])

        message.channel.send({
            embeds: [embed],
            components: [row]
        })
    }
}