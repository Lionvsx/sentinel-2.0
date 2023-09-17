const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super('interactionCreate')
    }

    async run(client, interaction) {
        if (interaction.user.bot) return
        if (interaction.inGuild()) return
        const buttonArgs = interaction.customId.split('|')
        let buttonInteraction = client.interactions.get(buttonArgs[0])
        if (buttonInteraction) {
            buttonInteraction.run(client, interaction, buttonArgs)
        } else if (interaction.isSelectMenu()) {
            const selectMenuArgs = interaction.customId.split('|')
            let selectMenu = client.interactions.get(selectMenuArgs[0])
            if (selectMenu) {
                selectMenu.run(client, interaction, selectMenuArgs)
            }
        }
    }
}
