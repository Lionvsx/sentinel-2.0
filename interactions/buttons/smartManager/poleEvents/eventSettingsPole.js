const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const {createButtonActionRow, createEmojiButton} = require("../../../../utils/functions/messageComponents");
module.exports = class EventSettingsPole extends BaseInteraction {
    constructor() {
        super('eventSettingsPole', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        return interaction.reply({
            content: "Non implémenté",
            ephemeral: true
        })
        if (interaction.message.components[1]) {
            interaction.message.components.splice(1, 1)
            await interaction.update({components: interaction.message.components})
            return
        }

        let settingsButtonRow = createButtonActionRow([
            createEmojiButton(`alertEventPole|${buttonArgs[1]}`, 'Alert', 'SECONDARY', '<:bell:1153604390356271124>'),
            createEmojiButton(`editEventPole|${buttonArgs[1]}`, 'Edit', 'SECONDARY', '<:edit:1137390634605481986>'),
            createEmojiButton(`addTrackerPole|${buttonArgs[1]}`, 'Add/Edit Link', 'SECONDARY', '<:link:1137424150764474388>'),
            createEmojiButton(`deleteEventPole|${buttonArgs[1]}`, 'Delete', 'SECONDARY', '<:trash:1137390663797841991>'),
            createEmojiButton(`addInfoEventPole|${buttonArgs[1]}`, 'Add/Edit Info', 'SECONDARY', '<:messagesquare:1137390645972049970>')
        ])

        interaction.message.components.push(settingsButtonRow)
        await interaction.update({components: interaction.message.components})

    }
}
