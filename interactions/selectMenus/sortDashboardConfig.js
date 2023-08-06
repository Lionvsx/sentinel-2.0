const { updateUserDashboard, updateDatabaseView } = require('../../utils/functions/sentinelFunctions')
const BaseInteraction = require('../../utils/structures/BaseInteraction')
const mongoose = require('mongoose')
const { isMember } = require('../../utils/functions/dbFunctions')





module.exports = class SortDashboardInteraction extends BaseInteraction {
    constructor() {
        super('sortDashboardConfig', 'utils', 'selectMenu', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const selectedOptionArgs = interaction.values[0].split('|')
        if (selectedOptionArgs[0] != 'lastAG') {
            const allUsers = await mongoose.model('User').find(scopesMap.get(selectedOptionArgs[0]))

            updateDatabaseView(sortFunctions.get(selectedOptionArgs[1]), interaction, allUsers, [
                { name: userFieldsName.get(selectedOptionArgs[2]), id: selectedOptionArgs[2] },
                { name: userFieldsName.get(selectedOptionArgs[3]), id: selectedOptionArgs[3] },
                { name: userFieldsName.get(selectedOptionArgs[4]), id: selectedOptionArgs[4] },
            ])
        } else if (selectedOptionArgs[0] === 'lastAG') {
            const lastAG = await mongoose.model('Presence').findOne().sort({ _id: -1 })
            const memberCheck = formatUserIds(lastAG.memberCheck)
            const audience = formatUserIds(lastAG.audience)

            const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true })


            const invitedMembers = formatData(allUsers.filter(member => {
                return memberCheck.includes(member.discordId) && !audience.includes(member.discordId)
            }), '📨')
            const missingMembers = formatData(allUsers.filter(member => {
                return !memberCheck.includes(member.discordId) && audience.includes(member.discordId)
            }), '<:x_:1137419292946727042>')
            const presenceMembers = formatData(allUsers.filter(member => {
                return memberCheck.includes(member.discordId) && audience.includes(member.discordId)
            }), '✅')

            const allAgUsers = presenceMembers.concat(invitedMembers, missingMembers)
            updateDatabaseView(sortFunctions.get(selectedOptionArgs[1]), interaction, allAgUsers, [
                { name: userFieldsName.get(selectedOptionArgs[2]), id: selectedOptionArgs[2] },
                { name: userFieldsName.get(selectedOptionArgs[3]), id: selectedOptionArgs[3] },
                { name: userFieldsName.get(selectedOptionArgs[4]), id: selectedOptionArgs[4] },
            ])
        }
    }
}
function formatUserIds(dataset) {
    return dataset.map(user => user.discordId)
}

function formatData(dataset, presence) {
    return dataset.map(user => ({
        username: user.username,
        userTag: user.userTag,
        presence: presence,
        firstName: user.firstName,
        lastName: user.lastName,
        school: user.school,
        schoolYear: user.schoolYear,
        discordId: user.discordId,
        role: user.roles[0],
        isMember: user.isMember,
        isResponsable: user.isResponsable,
        isBureau: user.isBureau,
        isAdmin: user.isAdmin,
        roleResponsable: user.roleResponsable
    }))
}

const scopesMap = new Map([
    [ 'Users', { onServer: true, isMember: true } ],
    [ 'DA', { onServer: true, isMember: true, role: { $regex: 'da' } } ],
    [ 'Esport', { onServer: true, isMember: true, role: { $regex: 'esport' } } ],
    [ 'Com', { onServer: true, isMember: true, role: { $regex: 'com' } } ],
    [ 'Partenariat', { onServer: true, isMember: true, role: { $regex: 'partenariat' } } ],
    [ 'Event', { onServer: true, isMember: true, role: { $regex: 'event' } } ],
    [ 'WebTV', { onServer: true, isMember: true, role: { $regex: 'webtv' } } ],
    [ 'Staff', { onServer: true, isMember: true, role: { $regex: 'staff' } } ],
    [ 'Joueurs',  { onServer: true, isMember: true, role: { $regex: 'joueur' } } ]
])

const sortFunctions = new Map([
    ['sortByRole', function (userA, userB) {
        if (userA.isAdmin && userB.isBureau) return -1
        if (userA.isAdmin && userB.isResponsable) return -1
        if (userA.isAdmin && userB.isMember) return -1
    
        if (userA.isBureau && userB.isResponsable && !userB.isAdmin) return -1
        if (userA.isBureau && userB.isMember && !userB.isAdmin) return -1
    
        if (userA.isResponsable && userB.isMember && !userB.isAdmin && !userB.isBureau) return -1
    
        if (userA.isMember && !userB.isMember && !userB.isAdmin && !userB.isBureau && userB.isResponsable) return -1
        return 0;
    }],
    ['sortByMemberStatus', function (userA, userB) {
        if (isMember(userA) && !isMember(userB)) return -1
        if (!isMember(userA) && isMember(userB)) return 1
        return 0
    }],
    ['sortByUser', function (userA, userB) {
        return userA.userTag.localeCompare(userB.userTag)
    }],
    ['sortByFirstName', function (userA, userB) {
        if (userA.firstName && userB.firstName) return userA.firstName.localeCompare(userB.firstName)
        return 0
    }],
    ['sortByLastName', function (userA, userB) {
        if (userA.lastName && userB.lastName) return userA.lastName.localeCompare(userB.lastName)
        return 0
    }],
    ['sortByPresence', function (userA, userB) {
        if (userA.presence === '✅' && userB.presence === '<:x_:1137419292946727042>') return -1
        if (userA.presence === '✅' && userB.presence === '✉') return -1
        if (userA.presence === '✉' && userB.presence === '<:x_:1137419292946727042>') return -1
        return 0;
    }]
])

const userFieldsName = new Map([
    ['fullName', 'Nom Complet'],
    ['lastName', 'Nom'],
    ['firstName', 'Prénom'],
    ['memberRole', 'Role'],
    ['memberGeneralRole', 'Catégorie'],
    ['memberSpecificRole', 'Pôle'],
    ['username', 'Pseudo'],
    ['userTag', 'Pseudo'],
    ['school', 'Ecole'],
    ['schoolYear', 'Année'],
    ['schoolAndYear', 'Ecole & Année'],
    ['presence', 'Présence'],
])