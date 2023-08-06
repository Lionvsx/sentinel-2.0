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

    async run (bot, message, args) {
        const DashBoardDev = new Discord.MessageEmbed()
            .setColor('2b2d31')
            .setTitle('DASHBOARD ADMIN')
            .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
            .setDescription("Panneau de controle pour les administrateurs serveur afin de gérer le bot et le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '📟 | SYNC DATABASE', value: 'Synchronise les utilisateurs présents sur le serveur avec ceux enregistrés dans la base de données', inline: true },
                { name: '<:power:1137470789935964241> | ` REBOOT BOT `', value: "Vous permet de redémarrer tout le programme derrière le bot", inline: true },
                { name: '<:alertoctagon:1137471018584244406> | ` NUKE MEMBERS `', value: "Rétablit les rôles de tout les utilisateurs aux rôles strictement essentiels et re-sync la base de données en conséquence", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '↩️ | NOTION SYNC', value: 'Synchronise notion et le serveur discord en checkant toutes les propriétée', inline: true },
                { name: '<:messagecircle:1137423168080973874> | CHANGE BOT MESSAGE', value: 'Vous permet d\'ajouter, de supprimer et de gérer les différentes équipes du serveur', inline: true },
                { name: '<:users:1137390672194850887> | TEAM SYNC', value: 'Synchronise la configuration des teams notion sur le serveur', inline: true },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonSyncDatabase', 'Synchroniser la base de données', 'SECONDARY', '📟'),
                createEmojiButton('buttonRebootBot', 'Redémarrer le bot', 'SECONDARY', '<:power:1137470789935964241>'),
                createEmojiButton('buttonNukeServer', 'Reset tout les utilisateurs', 'SECONDARY', '<:alertoctagon:1137471018584244406>')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonNotionSync', 'Synchronise la base de données notion', 'SECONDARY', '↩️'),
                createEmojiButton('buttonChangeBotStatus', 'Changer le message d\'humeur du bot', 'SECONDARY', '<:messagecircle:1137423168080973874>'),
                createEmojiButton('buttonSyncTeams', 'Synchronise les équipes du serveur', 'SECONDARY', '<:users:1137390672194850887>'),
            ])
            message.channel.send({
                embeds: [DashBoardDev],
                components: [Row1, Row2]
            })

        message.delete()
    }
}