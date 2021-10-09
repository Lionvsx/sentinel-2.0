const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js'); 
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashRespoCommand extends BaseCommand {
    constructor () {
        super('dashboardrespo', 'dashboard', [], {
            usage: "dashboardrespo",
            description: "Crée un dashboard pour les responsables",
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
        
        const DashBoardRespo = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('DASHBOARD RESPONSABLES')
            .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
            .setDescription("Panneau de controle pour les responsables afin d'intéragir avec le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '📢 | ANNONCES', value: 'Ouvre une interface en MP afin de créer une annonce personnalisée', inline: true },
                { name: '✅ | CREATE CHANNEL', value: "Vous permet de créer un salon personnalisé dans votre catégorie", inline: true },
                { name: '🗑️ | DELETE CHANNEL', value: "Vous permet de supprimer un salon de votre catégorie", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '🎫 | OPEN CUSTOM TICKET', value: "Ouvre un ticket avec des paramètres personnalisés", inline: true },
                { name: '➕ | ADD USER', value: "Ajoutez des utilisateurs à votre pôle", inline: true },
                { name: '➖ | REMOVE USER', value: "Retire des utilisateurs de votre pôle", inline: true },
            )
        const Row1 = createButtonActionRow([
            createEmojiButton('buttonAnnonce', 'Faire une annonce', 'PRIMARY', '📢'),
            createEmojiButton('buttonCreateChannel', 'Créer un salon', 'SUCCESS', '✅'),
            createEmojiButton('buttonDeleteChannel', 'Supprimer un salon', 'DANGER', '🗑️')
        ])
        const Row2 = createButtonActionRow([
            createEmojiButton('buttonCustomTicket', 'Créer un ticket', 'SECONDARY', '🎫'),
            createEmojiButton('buttonAddUser', 'Ajouter des staffs', 'SUCCESS', '➕'),
            createEmojiButton('buttonRemoveUser', 'Retirer des staffs', 'DANGER', '➖'),
        ])
        message.channel.send({
            embeds: [DashBoardRespo],
            components: [Row1, Row2]
        })

        message.delete()

    }
}