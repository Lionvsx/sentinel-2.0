const BaseInteraction = require('../../../../utils/structures/BaseInteraction')

module.exports = class buttonUpdateTeam extends BaseInteraction {
    constructor() {
        super('buttonUpdateTeam', 'dashboards', 'button', {
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