const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const { updateUserDashboard } = require('../../../../utils/functions/sentinelFunctions')
const { isMember } = require('../../../../utils/functions/dbFunctions')

module.exports = class SortByMemberStatusButton extends BaseInteraction {
    constructor() {
        super('buttonSortByMemberStatus', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await updateUserDashboard(sortByMemberStatus, interaction)
    }
}

var sortByMemberStatus = function (userA, userB) {
    if (isMember(userA) && !isMember(userB)) return -1
    if (!isMember(userA) && isMember(userB)) return 1
    return 0
}

