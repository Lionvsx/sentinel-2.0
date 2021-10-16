const BaseCommand = require('../../utils/structures/BaseCommand')
const Team = require('../../src/schemas/TeamSchema');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TeamInfoCommand extends BaseCommand {
    constructor() {
        super('team-info', 'teams', [], {
            usage: 'team-info',
            description: 'Affiche les informations d\'une équipe',
            categoryDisplayName: `👥 Teams`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: false,
            subCommands: true,
            home: true
        });
    }

    async run(client, message, args) {
        const existingTeam = await Team.findOne({ linkedCategoryId: message.channel.parentId })

        if (existingTeam && existingTeam._id) {
            const Players = await mongoose.model('User').find({ onServer: true, isMember: true, role: { $regex: existingTeam._id } })
            const allRoles = message.guild.roles.cache
            const allMembers = await updateGuildMemberCache(message.guild)
            const linkedRole = allRoles.get(existingTeam.linkedRoleId)

            const managers = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '622108209175593020', '744234761282650213'))
            const coachs = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '622108099569909762', '744234761282650213'))

            const embed = new MessageEmbed()
                .setTitle(existingTeam.name)
                .setDescription(`\`\`\`\nJEU: ${existingTeam.game}\`\`\``)
                .addFields(
                    { name: `\`\`Joueurs\`\``, value: `\`\`\`\n${ Players?.length > 0 ? Players.map(user => user.userTag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                    { name: `\`\`Coachs\`\``, value: `\`\`\`\n${ coachs?.size > 0 ? coachs.map(m => m.user.tag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                    { name: `\`\`Managers\`\``, value: `\`\`\`\n${ managers?.size > 0 ? managers.map(m => m.user.tag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                )
                .setColor('#e67e22')
            message.channel.send({
                embeds: [embed]
            })
        } else message.channel.send(`**❌ | **Ce channel n'heberge aucune équipe !`)
    }
}