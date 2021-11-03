const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js');
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashBureauCommand extends BaseCommand {
    constructor () {
        super('dashboarddev', 'dashboard', [], {
            usage: "dashboarddev",
            description: "Crée un dashboard pour les devs",
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

    async run (bot, message, args) {
        const DashBoardDev = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('DASHBOARD ADMIN')
            .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
            .setDescription("Panneau de controle pour les administrateurs serveur afin de gérer le bot et le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '📟 | SYNC DATABASE', value: 'Synchronise les utilisateurs présents sur le serveur avec ceux enregistrés dans la base de données', inline: true },
                { name: '🔄 | REBOOT BOT', value: "Vous permet de redémarrer tout le programme derrière le bot", inline: true },
                { name: '☢ | NUKE MEMBERS', value: "Rétablit les rôles de tout les utilisateurs aux rôles strictement essentiels et re-sync la base de données en conséquence", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '👥 | MANAGE TEAMS', value: 'Vous permet d\'ajouter, de supprimer et de gérer les différentes équipes du serveur', inline: true },
                { name: '💬 | CHANGE BOT MESSAGE', value: 'Vous permet d\'ajouter, de supprimer et de gérer les différentes équipes du serveur', inline: true },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonSyncDatabase', 'Synchroniser la base de données', 'PRIMARY', '📟'),
                createEmojiButton('buttonRebootBot', 'Redémarrer le bot', 'SUCCESS', '🔄'),
                createEmojiButton('buttonNukeServer', 'Reset tout les utilisateurs', 'DANGER', '☢')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonManageTeams', 'Gérer les équipes du serveur', 'PRIMARY', '👥'),
                createEmojiButton('buttonChangeBotStatus', 'Changer le message d\'humeur du bot', 'SECONDARY', '💬'),
            ])
            message.channel.send({
                embeds: [DashBoardDev],
                components: [Row1, Row2]
            })

        message.delete()
    }
}