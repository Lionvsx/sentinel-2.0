const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js');
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashBureauCommand extends BaseCommand {
    constructor () {
        super('dashboardbureau', 'dashboard', [], {
            usage: "dashboardbureau",
            description: "",
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
        const DashBoardBureau = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('DASHBOARD BUREAU')
            .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
            .setDescription("Panneau de controle pour le bureau afin d'intéragir avec le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '📢 | ANNONCES', value: 'Ouvre une interface en MP afin de créer une annonce personnalisée', inline: true },
                { name: '✅ | ACCESS CHANNELS', value: "Vous permet d'accéder à la catégorie souhaitée", inline: true },
                { name: '🕐 | TEMP CHANNEL', value: "Créez un channel vocal temporaire (ex: reunion)", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '👋 | KICK & BAN', value: "Vous permet d'expulser n'importe quel membre du discord", inline: true },
                { name: '🛑 | NUKE', value: "Nuke les roles d'un utilisateur", inline: true },
                { name: '🎫 | OPEN CUSTOM TICKET', value: "Ouvre un ticket avec des paramètres forcés", inline: true },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonAnnonce', 'Annonces', 'PRIMARY', '📢'),
                createEmojiButton('buttonAccessChannel', 'Accès aux Catégories', 'PRIMARY', '✅'),
                createEmojiButton('buttonTempChannel', 'Channel Temporaire', 'PRIMARY', '🕐')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonKickBan', 'A définir', 'PRIMARY', '👋'),
                createEmojiButton('buttonNuke', 'A définir', 'PRIMARY', '🛑'),
                createEmojiButton('buttonCustomTicket', 'Custom Ticket', 'PRIMARY', '🎫'),
            ])
            message.channel.send({
                embeds: [DashBoardBureau],
                components: [Row1, Row2]
            })

        message.delete()
    }
}