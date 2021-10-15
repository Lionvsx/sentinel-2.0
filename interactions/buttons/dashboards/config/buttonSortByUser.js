const { updateUserDashboard } = require('../../../../utils/functions/sentinelFunctions')
const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')


module.exports = class SortByUserButton extends BaseInteraction {
    constructor() {
        super('buttonSortByUser', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await updateUserDashboard(sortByUser, interaction)
    }
}

var sortByUser = function (userA, userB) {
    return userA.userTag.localeCompare(userB.userTag)
}