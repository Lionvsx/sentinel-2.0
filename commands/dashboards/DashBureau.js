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
        const DashBoardBureau = new Discord.MessageEmbed()
            .setColor('2b2d31')
            .setTitle(`${client.slidersEmoji} \`\` DASHBOARD BUREAU \`\``)
            .setThumbnail('https://cdn.discordapp.com/attachments/624720345919651866/1137401889269493791/compass-3.png')
            .setDescription("Panneau de controle pour le bureau afin d'intéragir avec le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: `${client.sendEmoji} | \` ANNONCES \``, value: "Envoie un message sur plusieurs canaux", inline: false },
                { name: `${client.checkSquareEmoji} | \` ACCESS CATEGORY \``, value: "Vous permet d'accéder à la catégorie souhaitée", inline: false },
                { name: `${client.usersEmoji} | \` ADD / REMOVE RESPO \``, value: "Ajoute ou supprime un membre de la liste des responsables", inline: false },
                { name: `${client.ticketEmoji} | \` OPEN CUSTOM TICKET \``, value: "Ouvre un ticket avec des paramètres personnalisés", inline: false },
                { name: `${client.plusCircleEmoji} | \` CREATE CHANNEL \``, value: "Vous permet de créer un salon dans la catégorie bureau", inline: false },
                { name: `${client.minusCircleEmoji} | \` DELETE CHANNEL \``, value: "Vous permet de supprimer un channel dans la catégorie bureau", inline: false },
                { name: `${client.triangleEmoji} | \` START / END AG \``, value: "Vous permet de démarrer ou d'arrêter une Assemblée Générale", inline: false },
                { name: `${client.userPlusEmoji} | \` ADD ASSO MEMBERS \``, value: "Vous permet d'ajouter des membres à l'association", inline: false },
            )
            const Row1 = createButtonActionRow([
                createEmojiButton('buttonAnnonce', '', 'SECONDARY', client.sendEmoji),
                createEmojiButton('buttonAccessCategory', '', 'SECONDARY', client.checkSquareEmoji),
                createEmojiButton('buttonManageRespo', '', 'SECONDARY', client.usersEmoji),
                createEmojiButton('buttonCustomTicket', '', 'SECONDARY', client.ticketEmoji),
            ])
            const Row2 = createButtonActionRow([
                createEmojiButton('buttonCreateChannelBureau', '', 'SECONDARY', client.plusCircleEmoji),
                createEmojiButton('buttonDeleteChannelBureau', '', 'SECONDARY', client.minusCircleEmoji),
                createEmojiButton('buttonManageAG', '', 'SECONDARY', client.triangleEmoji),
                createEmojiButton('buttonRegisterMembers', '', 'SECONDARY', client.userPlusEmoji),
            ])
            message.channel.send({
                embeds: [DashBoardBureau],
                components: [Row1, Row2]
            })

        message.delete()
    }
}