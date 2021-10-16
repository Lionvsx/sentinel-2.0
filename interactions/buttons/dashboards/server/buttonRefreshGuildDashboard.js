const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')

module.exports = class RefreshGuildDashButton extends BaseInteraction {
    constructor() {
        super('buttonRefreshGuildDashboard', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

    }
}