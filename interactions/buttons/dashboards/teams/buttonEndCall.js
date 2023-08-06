const BaseInteraction = require('../../../../utils/structures/BaseInteraction')

module.exports = class buttonEndCall extends BaseInteraction {
    constructor() {
        super('buttonEndCall', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `L'appel est fermé !`,
            ephemeral: true
        })
        
    }
}