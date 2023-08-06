const BaseInteraction = require('../../../../utils/structures/BaseInteraction')

module.exports = class ButtonStartCall extends BaseInteraction {
    constructor() {
        super('buttonStartCall', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `L'appel est ouvert !`,
            ephemeral: true
        })
    }
}