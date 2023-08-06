const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')

module.exports = class ButtonStartCall extends BaseInteraction {
    constructor() {
        super('buttonStartCall', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `L'appel a été ouvert !`,
            ephemeral: true
        })
    }
}