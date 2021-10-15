const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const { updateUserDashboard } = require('../../../../utils/functions/sentinelFunctions')

module.exports = class RefreshUserDashButton extends BaseInteraction {
    constructor() {
        super('buttonRefreshUserDashboard', 'dashboards', 'button', {
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

    // if (userB.isAdmin && userA.isBureau) return 1
    // if (userB.isAdmin && userA.isResponsable) return 1
    // if (userB.isAdmin && userA.isMember) return 1

    // if (userB.isBureau && userA.isResponsable) return 1
    // if (userB.isBureau && userA.isMember) return 1

    // if (userB.isResponsable && userB.isMember) return 1
    return 0;
}