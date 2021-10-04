const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js'); 

module.exports = class DashRespoCommand extends BaseCommand {
    constructor () {
        super('dashboardrespo', 'dashboard', [], {
            usage: "dashboardrespo",
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
        const DashBoardRespo = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('DASHBOARD RESPONSABLES')
            .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
            .setDescription("Panneau de controle pour les responsables afin d'intéragir avec le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '📢 | ANNONCES', value: 'Ouvre une interface en MP afin de créer une annonce personnalisée', inline: true },
                { name: '✅ | CREATE CHANNEL', value: "Vous permet de créer un channel personnalisé dans vôtre catégorie", inline: true },
                { name: '❌ | DELETE CHANNEL', value: "Vous permet de supprimer un channel personnalisé dans vôtre catégorie", inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: '🆕 | ADD NEW USER', value: "Ajoutez un nouvel utilisateur à votre catégorie", inline: true },
                { name: '⏏️ | KICK USER', value: "Ejecter un utilisateur de des channels de vôtre catégorie", inline: true },
                { name: '🎫 | OPEN CUSTOM TICKET', value: "Ouvre un ticket avec des paramètres forcés", inline: true },
            )
        message.channel.send(DashBoardRespo).then(async (msg) => {
            await msg.react('📢')
            await msg.react('✅')
            await msg.react('❌')
            await msg.react('🆕')
            await msg.react('⏏️')
            await msg.react('🎫')
        })

        message.delete()
    }
}