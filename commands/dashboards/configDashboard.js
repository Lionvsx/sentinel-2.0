const { MessageEmbed, Permissions, MessageActionRow, MessageButton } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createButtonActionRow,
    createEmojiButton,
    createButton,
    createMessageActionRow
} = require('../../utils/functions/messageComponents');
const { getDateTime } = require('../../utils/functions/systemFunctions');
const mongoose = require('mongoose');
const { isMember } = require('../../utils/functions/dbFunctions');
const { chunkArray } = require('../../utils/functions/utilitaryFunctions');

module.exports = class ConfigDashCommand extends BaseCommand {
    constructor () {
        super('dashboardconfig', 'dashboard', [], {
            usage: "dashboardconfig",
            description: "Crée un dashboard de configuration",
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

        const embedsArray = [];

        embedsArray.push(
            new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("DASHBOARD DE CONFIGURATION")
                .setDescription(`Vous permet de gérer tout les membres du serveur LDV Esport inscrits dans la DB\n\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
        )
        // Users in LDV DB
        // AG Planifiées
        // Tickets viewer + Archive
        // Server Users + Archive

        //Buttons to sort data

        const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true})
        const userRows = []
        const roleRows = []
        const memberRows = []

        allUsers.sort(sortByRole)

        for (const user of allUsers) {
            await user.isMember ? isMember(user) ? memberRows.push(`${user.firstName} - ${user.lastName}`) : memberRows.push(`DATA INCOMPLETE`) : memberRows.push(`NOT MEMBER`)
            await user.isAdmin ? roleRows.push(`ADMIN`) : user.isBureau ? roleRows.push(`BUREAU`) : user.isResponsable ? roleRows.push(`RESPONSABLE`) : user.isMember ? roleRows.push(`MEMBER`) : roleRows.push(`USER`)
            userRows.push(user.username)
        }
        const userChunks = chunkArray(userRows, 50)
        const roleChunks = chunkArray(roleRows, 50)
        const memberChunks = chunkArray(memberRows, 50)

        for (let i = 0; i < userChunks.length; i++) {
            embedsArray.push(new MessageEmbed().addFields(
                { name: `\`User\``, value: `\`\`\`\n${userChunks[i].join('\n')}\`\`\``, inline: true },
                { name: `\`Member Status\``, value: `\`\`\`\n${memberChunks[i].join('\n')}\`\`\``, inline: true },
                { name: `\`Role\``, value: `\`\`\`\n${roleChunks[i].join('\n')}\`\`\``, inline: true }
            ).setColor('#f1c40f'))
        }

        message.channel.send({
            embeds: embedsArray,
            components: [createMessageActionRow([
                createEmojiButton('buttonSortByUser', 'Trier par utilisateur', 'PRIMARY', '🔽'),
                createEmojiButton('buttonSortByRole', 'Trier par role', 'PRIMARY', '🔽'),
                createEmojiButton('buttonSortByMemberStatus', 'Trier par statut sur le serveur', 'PRIMARY', '🔽')
            ]), createMessageActionRow([
                createEmojiButton('buttonRefreshUserDashboard', 'Mettre à jour les données', 'SUCCESS', '🔄'),
                createEmojiButton('buttonFixDatabaseData', 'Renvoyer le formulaire aux membres sans données', 'DANGER', '📨'),

            ])]
        })

        message.delete()
    }
}

var sortByRole = function (userA, userB) {
    if (userA.isAdmin && userB.isBureau) return -1
    if (userA.isAdmin && userB.isResponsable) return -1
    if (userA.isAdmin && userB.isMember) return -1

    if (userA.isBureau && userB.isResponsable && !userB.isAdmin) return -1
    if (userA.isBureau && userB.isMember && !userB.isAdmin) return -1

    if (userA.isResponsable && userB.isMember && !userB.isAdmin && !userB.isBureau) return -1

    if (userA.isMember && !userB.isMember && !userB.isAdmin && !userB.isBureau && userB.isResponsable) return -1

    // if (userB.isAdmin && userA.isBureau) return 1
    // if (userB.isAdmin && userA.isResponsable) return 1
    // if (userB.isAdmin && userA.isMember) return 1

    // if (userB.isBureau && userA.isResponsable) return 1
    // if (userB.isBureau && userA.isMember) return 1

    // if (userB.isResponsable && userB.isMember) return 1
    return 0;
}


