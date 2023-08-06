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
        
        const DashBoardRespo = new Discord.MessageEmbed()
            .setColor('#2b2d31')
            .setTitle('<:zap:1137424324144410736> `` DASHBOARD RESPONSABLES ``')
            .setThumbnail('https://cdn.discordapp.com/attachments/624720345919651866/1137401889269493791/compass-3.png')
            .setDescription("Panneau de controle pour les responsables afin d'intéragir avec le discord \nToutes les fonctionnalités sont expliquées ci dessous:")
            .addFields(
                { name: '<:send:1137390655019171960> | ` ANNONCES `', value: 'Envoie un message sur plusieurs canaux', inline: false },
                { name: '<:pluscircle:1137390650690650172> | ` CREATE CHANNEL `', value: "Vous permet de créer un salon personnalisé dans votre catégorie", inline: false },
                { name: '<:minuscircle:1137390648262135951> | ` DELETE CHANNEL `', value: "Vous permet de supprimer un salon de votre catégorie", inline: false },
                { name: '<:messagesquare:1137390645972049970> | ` OPEN CUSTOM TICKET `', value: "Ouvre un ticket avec des paramètres personnalisés", inline: false },
                { name: '<:userplus:1137394694972788837> | ` ADD USER `', value: "Ajoutez des utilisateurs à votre pôle", inline: false },
                { name: '<:userminus:1137394849025359992> | `REMOVE USER `', value: "Retire des utilisateurs de votre pôle", inline: false },
            )
        const Row1 = createButtonActionRow([
            createEmojiButton('buttonAnnonce', '', 'SECONDARY', '<:send:1137390655019171960>'),
            createEmojiButton('buttonCreateChannel', '', 'SECONDARY', '<:pluscircle:1137390650690650172>'),
            createEmojiButton('buttonDeleteChannel', '', 'SECONDARY', '<:minuscircle:1137390648262135951>')
        ])
        const Row2 = createButtonActionRow([
            createEmojiButton('buttonCustomTicket', '', 'SECONDARY', '<:messagesquare:1137390645972049970>'),
            createEmojiButton('buttonAddUser', '', 'SECONDARY', '<:userplus:1137394694972788837>'),
            createEmojiButton('buttonRemoveUser', '', 'SECONDARY', '<:userminus:1137394849025359992>'),
        ])
        message.channel.send({
            embeds: [DashBoardRespo],
            components: [Row1, Row2]
        })

        message.delete()

    }
}