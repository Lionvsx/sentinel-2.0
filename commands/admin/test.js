const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    reactionEmbedSelector
} = require('../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

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
        const interaction = await reactionEmbedSelector(message.channel, ['💫', '💔'], embed)

        interaction.update({
            content: `Selectionné : ${interaction.customId}`,
            components: [],
            embeds: []
        })
    }
}