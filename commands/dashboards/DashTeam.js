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

        
            const DashBoardTeam = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${existingTeam.emoji} | DASHBOARD ${existingTeam.name.toUpperCase()}`)
                .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
                .setDescription("Panneau de controle pour les managers afin de gérer son équipe. \nToutes les fonctionnalités sont expliquées ci-dessous:")
                .addFields(
                    { name: `\`\`JEU\`\``, value: `\`\`\`${existingTeam.emoji} | ${existingTeam.game}\`\`\``, inline: false },
                    { name: `\`\`Joueurs\`\``, value: `\`\`\`\n${ Players?.length > 0 ? Players.map(user => user.userTag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                    { name: `\`\`Coachs\`\``, value: `\`\`\`\n${ coachs?.size > 0 ? coachs.map(m => m.user.tag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                    { name: `\`\`Managers\`\``, value: `\`\`\`\n${ managers?.size > 0 ? managers.map(m => m.user.tag).join('\n') : 'Aucun' }\`\`\``, inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: '▶️ | START CALL', value: 'Démarrer l\'appel', inline: true },
                    { name: '⏹️ | END CALL', value: "Clôturer l'appel", inline: true },
                    { name: '✏️ | EDIT TEAM', value: "Vous permet de changer le nom ou l'emoji de l'équipe", inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: '⚙️ | MANAGE PLAYER', value: "Ajouter ou retirer un joueur de votre équipe", inline: true },
                    { name: '📩 | INVITE PLAYER', value: "Inviter un joueur **extérieur** à votre équipe", inline: true },
                    { name: '🔄 | UPDATE TEAM PERMS', value: "Met à jour les permissions de vos salons", inline: true },
                )
            const Row1 = createButtonActionRow([
                createEmojiButton(`buttonStartCall|${existingTeam._id}`, 'Démarrer l\'appel', 'SUCCESS', '▶️'),
                createEmojiButton(`buttonEndCall|${existingTeam._id}`, 'Arrêter l\'appel', 'DANGER', '⏹️'),
                createEmojiButton(`buttonEditTeam|${existingTeam._id}`, 'Modifier votre équipe', 'PRIMARY', '✏️')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton(`buttonManagePlayer|${existingTeam._id}`, 'Gérer un joueur', 'SECONDARY', '⚙️'),
                createEmojiButton(`buttonInvitePlayer|${existingTeam._id}`, 'Inviter un joueur', 'SECONDARY', '📩'),
                createEmojiButton(`buttonUpdateTeam|${existingTeam._id}`, 'Mettre à jour les permissions', 'SECONDARY', '🔄'),
            ])
            message.channel.send({
                embeds: [DashBoardTeam],
                components: [Row1, Row2]
            })


        } else message.channel.send(`**<:x_:1137419292946727042> | **Ce channel n'heberge aucune équipe !`)
    
        message.delete()

    }
}