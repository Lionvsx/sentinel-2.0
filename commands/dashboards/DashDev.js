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
            .setColor('#2b2d31')
            .setTitle('<:triangle:1137394274816753695> ` DASHBOARD ADMIN `')
            .setThumbnail('https://cdn.discordapp.com/attachments/624720345919651866/1137401889269493791/compass-3.png')
            .setDescription("Panneau de controle pour les administrateurs serveur afin de gérer le bot et le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '<:activity:1137390592314331176> | ` SYNC DATABASE `', value: 'Synchronise les utilisateurs serveur avec la base de données', inline: false },
                { name: '<:power:1137470789935964241> | ` REBOOT BOT `', value: "Vous permet de redémarrer tout le programme derrière le bot", inline: false },
                { name: '<:alertoctagon:1137471018584244406> | ` NUKE MEMBERS `', value: "Rétablit les rôles de tout les utilisateurs aux rôles essentiels", inline: false },
                { name: '<:shield:1137411685716611143> | ` CLEAN PERMISSIONS `', value: 'Enleve les permissions individuelles sur les channels', inline: false },
                { name: '<:messagecircle:1137423168080973874> | ` CHANGE BOT MESSAGE `', value: 'Changez le message d\'humeur du bot', inline: false },
                { name: '<:users:1137390672194850887> | ` TEAM SYNC `', value: 'Synchronise la configuration des teams notion sur le serveur', inline: false },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonSyncDatabase', '', 'SECONDARY', '<:activity:1137390592314331176>'),
                createEmojiButton('buttonRebootBot', '', 'SECONDARY', '<:power:1137470789935964241>'),
                createEmojiButton('buttonNukeServer', '', 'SECONDARY', '<:alertoctagon:1137471018584244406>')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonCleanPermissions', '', 'SECONDARY', '<:shield:1137411685716611143>'),
                createEmojiButton('buttonChangeBotStatus', '', 'SECONDARY', '<:messagecircle:1137423168080973874>'),
                createEmojiButton('buttonSyncTeams', '', 'SECONDARY', '<:users:1137390672194850887>'),
            ])
            message.channel.send({
                embeds: [DashBoardDev],
                components: [Row1, Row2]
            })

        message.delete()
    }
}