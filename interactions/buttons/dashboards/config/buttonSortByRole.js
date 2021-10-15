const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const { updateUserDashboard } = require('../../../../utils/functions/sentinelFunctions')

module.exports = class SortByRoleButton extends BaseInteraction {
    constructor() {
        super('buttonSortByRole', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await updateUserDashboard(sortByRole, interaction)
    }
}

var sortByRole = function (userA, userB) {
    if (userA.isAdmin && userB.isBureau) return -1
    if (userA.isAdmin && userB.isResponsable) return -1
    if (userA.isAdmin && userB.isMember) return -1

    if (userA.isBureau && userB.isResponsable && !userB.isAdmin) return -1
    if (userA.isBureau && userB.isMember && !userB.isAdmin) return -1

    if (userA.isResponsable && userB.isMember && !userB.isAdmin && !userB.isBureau) return -1

    if (userA.isMember && !userB.isMember && !userB.isAdmin && !userB.isBureau && userB.isResponsable) return -1
    return 0;
}

