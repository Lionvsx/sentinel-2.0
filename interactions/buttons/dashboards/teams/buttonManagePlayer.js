const BaseInteraction = require('../../../../utils/structures/BaseInteraction')

module.exports = class buttonManagePlayer extends BaseInteraction {
    constructor() {
        super('buttonManagePlayer', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes DMs !`,
            ephemeral: true
        })
        
    }
}