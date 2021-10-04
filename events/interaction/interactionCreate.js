const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super('interactionCreate')
    }

    async run(client, interaction) {
        if (!interaction.inGuild()) return
        if (interaction.isCommand()) {
            let command = client.interactions.get(interaction.commandName)
            if (command) {
                command.run(client, interaction)
            }
        } else if (interaction.isButton()) {
            const buttonArgs = interaction.customId.split('|')
            let buttonInteraction = client.interactions.get(buttonArgs[0])
            if (buttonInteraction) {
                buttonInteraction.run(client, interaction, buttonArgs)
            }
        }
    }
}