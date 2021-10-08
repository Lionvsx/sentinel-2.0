const { MessageEmbed } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')

module.exports = class DashStaffCommand extends BaseCommand {
    constructor () {
        super('dashboardstaff', 'dashboard', [], {
            usage: "dashboardstaff",
            description: "Crée un dashboard pour le staff",
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
        const DashBoardStaff = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('DASHBOARD STAFF')
            .setThumbnail('https://cdn2.iconfinder.com/data/icons/flat-and-simple-part-4/128/power_v.1-512.png')
            .setDescription("Panneau de controle pour le staff afin d'intéragir avec le discord et le Head Staff \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '🎫 | TICKET STAFF', value: "Ouvre une interface en MP afin d'ouvrir un ticket personnalisé, pour une demande de communication, de cast ou autre", inline: true},
                { name: '💼 | REQUETE BUREAU', value: 'Envoyez une requete au Bureau de LDV Esport, par exemple pour un probleme Joueur - Manager', inline: true},
                { name: '\u200B', value: '\u200B' },
                { name: '🔧 | REQUETE STAFF TECHNIQUE', value: "Envoyez une requete au Staff Technique du Discord, par exemple pour la creation de channels ou un bug présent avec une des infrastructures du Discord."},
            )
        const Row = createButtonActionRow([
            createEmojiButton('buttonTicketStaff', 'Ticket Staff', 'PRIMARY', '🎫'),
            createEmojiButton('buttonTicketBureau', 'Ticket Bureau', 'PRIMARY', '💼'),
            createEmojiButton('buttonTicketTechnique', 'Ticket Staff Technique', 'PRIMARY', '🔧')
        ])
        message.channel.send({
            embeds: [DashBoardStaff],
            components: [Row]
        })

        message.delete()
    }
}