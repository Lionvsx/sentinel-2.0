const BaseCommand = require('../../utils/structures/BaseCommand');
const Team = require('../../src/schemas/TeamSchema');
const Discord = require('discord.js'); 
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashRespoCommand extends BaseCommand {
    constructor () {
        super('dashboardteam', 'dashboard', [], {
            usage: "dashboardteam",
            description: "Crée un dashboard pour l'équipe de ce salon",
            categoryDisplayName: `🧭 Dashboard`,
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
        
            const DashBoardTeam = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${existingTeam.emoji} | DASHBOARD ${existingTeam.name.toUpperCase()}`)
                .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
                .setDescription("Panneau de controle pour les managers afin de gérer son équipe. \nToutes les fonctionnalités sont expliquées ci-dessous:")
                .addFields(
                    { name: '\u200B', value: '\u200B' },
                    { name: '▶️ | START CALL', value: 'Démarrer l\'appel', inline: true },
                    { name: '⏹️ | END CALL', value: "Clôturer l'appel", inline: true },
                    { name: '✏️ | EDIT TEAM', value: "Vous permet de changer le nom ou l'emoji de l'équipe", inline: true },
                    { name: '\u200B', value: '\u200B' },
                    { name: '➕ | ADD PLAYER', value: "Ajouter un joueur à votre équipe", inline: true },
                    { name: '➖ | REMOVE PLAYER', value: "Retirer un joueur de votre équipe", inline: true },
                    { name: '🔄 | UPDATE TEAM PERMS', value: "Met à jour les permissions de vos salons", inline: true },
                )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonStartCall', 'Démarrer l\'appel', 'SUCCESS', '▶️'),
                createEmojiButton('buttonEndCall', 'Arrêter l\'appel', 'DANGER', '⏹️'),
                createEmojiButton('buttonEditTeam', 'Modifier votre équipe', 'PRIMARY', '✏️')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonAddPlayer', 'Ajouter un joueur', 'SUCCESS', '➕'),
                createEmojiButton('buttonRemovePlayer', 'Retirer un joueur', 'DANGER', '➖'),
                createEmojiButton('buttonUpdateTeamPerms', 'Mettre à jour les permissions', 'SECONDARY', '🔄'),
            ])
            message.channel.send({
                embeds: [DashBoardTeam],
                components: [Row1, Row2]
            })

        } else message.channel.send(`**❌ | **Ce channel n'heberge aucune équipe !`)
    
        message.delete()

    }
}