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
            description: "Crée un dashboard pour le bureau",
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
                { name: '✅ | ACCESS CATEGORY', value: "Vous permet d'accéder à la catégorie souhaitée", inline: true },
                { name: '🎓 | ADD / REMOVE RESPO', value: "Ajoute ou supprime un membre de la liste des responsables", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '🎫 | OPEN CUSTOM TICKET', value: "Ouvre un ticket avec des paramètres personnalisés", inline: true },
                { name: '🔺 | START / END AG', value: "Vous permet de démarrer ou d'arrêter une Assemblée Générale", inline: true },
                { name: '👥 | ADD ASSO MEMBERS', value: "Vous permet d'ajouter des membres en tant que membre associatifs", inline: true },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonAnnonce', 'Faire une annonce', 'PRIMARY', '📢'),
                createEmojiButton('buttonAccessCategory', 'Accès aux Catégories', 'SECONDARY', '✅'),
                createEmojiButton('buttonManageRespo', 'Gérer les respos', 'SECONDARY', '🎓')
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonCustomTicket', 'Créer un ticket', 'SECONDARY', '🎫'),
                createEmojiButton('buttonStartStopAg', 'Gérer les Assemblées Générales', 'DANGER', '🔺'),
                createEmojiButton('buttonRegisterMembers', 'Ajouter des membres à l\'asso', 'SUCCESS', '👥'),
            ])
            message.channel.send({
                embeds: [DashBoardBureau],
                components: [Row1, Row2]
            })

        message.delete()
    }
}