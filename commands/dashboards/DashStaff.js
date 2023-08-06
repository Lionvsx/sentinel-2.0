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
        const DashBoardStaff = new MessageEmbed()
            .setColor('2b2d31')
            .setTitle('<:coffee:1137422686432272446>` DASHBOARD STAFF `')
            .setThumbnail('https://cdn.discordapp.com/attachments/624720345919651866/1137401889269493791/compass-3.png')
            .setDescription("Panneau de controle pour le staff afin d'intéragir avec le discord et le Head Staff \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '<:messagesquare:1137390645972049970> | ` TICKET STAFF `', value: "Ouvre une interface en MP afin d'ouvrir un ticket personnalisé, pour une demande de communication, de cast ou autre", inline: false},
                { name: '<:briefcase:1137437117065207920> | ` REQUETE BUREAU `', value: 'Envoyez une requete au Bureau de LDV Esport, par exemple pour un probleme Joueur - Manager', inline: false},
                { name: '<:tool:1137412707629412453> | ` REQUETE STAFF TECHNIQUE `', value: "Envoyez une requete au Staff Technique du Discord, par exemple pour la creation de channels ou un bug présent avec une des infrastructures du Discord."},
            )
        const Row = createButtonActionRow([
            createEmojiButton('buttonTicketStaff', '', 'SECONDARY', '<:messagesquare:1137390645972049970>'),
            createEmojiButton('buttonTicketBureau', '', 'SECONDARY', '<:briefcase:1137437117065207920>'),
            createEmojiButton('buttonTicketTechnique', '', 'SECONDARY', '<:tool:1137412707629412453>')
        ])
        message.channel.send({
            embeds: [DashBoardStaff],
            components: [Row]
        })

        message.delete()
    }
}