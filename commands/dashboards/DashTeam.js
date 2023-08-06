const BaseCommand = require('../../utils/structures/BaseCommand');
const Team = require('../../src/schemas/TeamSchema');
const User = require('../../src/schemas/UserSchema');
const Discord = require('discord.js'); 
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashRespoCommand extends BaseCommand {
    constructor () {
        super('dashboardteam', 'dashboard', [], {
            usage: "dashboardteam",
            description: "Crée un dashboard pour l'équipe de ce salon",
            categoryDisplayName: `<:compass:1137390624090374228> Dashboard`,
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            home: true,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const existingTeam = await Team.findOne({ linkedCategoryId: message.channel.parentId })

        if (existingTeam && existingTeam._id) {
            const allRoles = message.guild.roles.cache
            const allMembers = await updateGuildMemberCache(message.guild)
            const linkedRole = allRoles.get(existingTeam.linkedRoleId)

            const Players = await User.find({ onServer: true, isMember: true, role: { $regex: existingTeam._id } })
            const managers = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '622108209175593020', '744234761282650213'))
            const coachs = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '622108099569909762', '744234761282650213'))

        


        } else message.channel.send(`**<:x_:1137419292946727042> | **Ce channel n'heberge aucune équipe !`)
    
        message.delete()

    }
}