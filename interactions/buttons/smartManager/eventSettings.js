const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const {createButtonActionRow, createEmojiButton} = require("../../../utils/functions/messageComponents");
module.exports = class EventSettings extends BaseInteraction {
    constructor() {
        super('eventSettings', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        if (!interaction.member.roles.cache.has('624715536693198888')) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous n\'avez pas la permission pour executer cette commande',
            ephemeral: true
        });

        if (interaction.message.components[1]) {
            interaction.message.components.splice(1, 1)
            await interaction.update({components: interaction.message.components})
            return
        }

        let settingsButtonRow = createButtonActionRow([
            createEmojiButton(`alertEvent|${buttonArgs[1]}`, 'Alert', 'SECONDARY', '<:bell:1153604390356271124>'),
            createEmojiButton(`editEvent|${buttonArgs[1]}`, 'Edit', 'SECONDARY', '<:edit:1137390634605481986>'),
            createEmojiButton(`addTracker|${buttonArgs[1]}`, 'Add/Edit Tracker', 'SECONDARY', '<:link:1137424150764474388>'),
            createEmojiButton(`deleteEvent|${buttonArgs[1]}`, 'Delete', 'SECONDARY', '<:trash:1137390663797841991>'),
            createEmojiButton(`addInfoEvent|${buttonArgs[1]}`, 'Add/Edit Info', 'SECONDARY', '<:messagesquare:1137390645972049970>')
        ])

        interaction.message.components.push(settingsButtonRow)
        await interaction.update({components: interaction.message.components})

    }
}
