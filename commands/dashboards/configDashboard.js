const { MessageEmbed, Permissions, MessageActionRow, MessageButton } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createButtonActionRow,
    createEmojiButton,
    createButton,
    createMessageActionRow,
    createSelectionMenu,
    createSelectionMenuOption
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

        const embedsArray = [];

        embedsArray.push(
            new MessageEmbed()
                .setColor('#2b2d31')
                .setTitle("\` DASHBOARD DE CONFIGURATION \`")
                .setDescription(`Vous permet de gérer tout les membres du serveur LDV Esport inscrits dans la DB\n\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
                .setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
                )
        // Users in LDV DB ✅
        // AG Planifiées 
        // Tickets viewer + Archive
        // Server Users + Archive

        //Buttons to sort data ✅

        // Option to remove user from DB

        const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true})
        const userRows = []
        const roleRows = []
        const memberRows = []

        allUsers.sort(sortByRole)

        for (const user of allUsers) {
            let fullName = `${user.firstName} ${user.lastName}`
            if (fullName?.length > 20) fullName = `${user.firstName} ${user.lastName.slice(0, 10)}.`
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
                { name: `\`Nom complet\``, value: `\`\`\`\n${memberChunks[i].join('\n')}\`\`\``, inline: true },
                { name: `\`Role\``, value: `\`\`\`\n${roleChunks[i].join('\n')}\`\`\``, inline: true }
            ).setColor('2b2d31').setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
            )
        }

        message.channel.send({
            embeds: embedsArray,
            components: [createMessageActionRow([
                createEmojiButton('buttonRefreshUserDashboard', 'Mettre à jour les données', 'SECONDARY', '🔄'),
                createEmojiButton('buttonFixDatabaseData', 'Renvoyer le formulaire aux membres sans données', 'SECONDARY', '📨'),
                createEmojiButton('buttonKickMember', 'Radier un membre de la DB', 'SECONDARY', '🚫'),

            ]), createMessageActionRow([
                createButton('currentDisplay', `Affichage : Pseudo - Nom Complet - Role`, 'SECONDARY').setDisabled(true),
                createButton('currentSortFunction', `Tri : Par rôle hiérarchique`, 'SECONDARY').setDisabled(true),
                createButton('lastUpdate', `Dernière MAJ : ${getDateTime()}`, 'SECONDARY').setDisabled(true),

            ]), createMessageActionRow([createSelectionMenu('sortDashboardConfig', 'Affichages Disponibles', [
                createSelectionMenuOption('Users|sortByRole|username|fullName|memberRole', `Triez par role hiérarchique`, `Affichage : Pseudo - Nom Complet - Role`, "<:users:1137390672194850887>"),
                createSelectionMenuOption('Users|sortByMemberStatus|username|fullName|memberRole', `Trier ceux qui ont pas remplir leurs infos`, `Affichage : Pseudo - Nom Complet - Role`, "<:users:1137390672194850887>"),
                createSelectionMenuOption('Users|sortByUser|username|memberGeneralRole|memberSpecificRole', `Membres triés par pseudo A=>Z`, `Affichage : Pseudo - Catégorie - Pôle`, "<:users:1137390672194850887>"),
                createSelectionMenuOption('Users|sortByUser|username|fullName|schoolAndYear', `Membres triés par pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:users:1137390672194850887>"),
                createSelectionMenuOption('Users|sortByLastName|lastName|firstName|schoolAndYear', `Membres triés par Nom A=>Z`, `Affichage : Nom - Prénom - Ecole Année`, "<:users:1137390672194850887>"),

                createSelectionMenuOption('lastAG|sortByPresence|username|fullName|presence', `Dernière AG triée par présence`, `Affichage : Pseudo - Nom Complet - Présence`, "<:triangle:1137394274816753695>"),
                createSelectionMenuOption('lastAG|sortByUser|username|fullName|presence', `Dernière AG triée par pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Présence`, "<:triangle:1137394274816753695>"),
                createSelectionMenuOption('lastAG|sortByPresence|firstName|lastName|presence', `Dernière AG triée par présence`, `Affichage : Prénom - Nom - Présence`, "<:triangle:1137394274816753695>"),
                createSelectionMenuOption('lastAG|sortByFirstName|firstName|lastName|presence', `Dernière AG triée par Prénom A=>Z`, `Affichage : Prénom - Nom - Présence`, "<:triangle:1137394274816753695>"),
                createSelectionMenuOption('lastAG|sortByPresence|fullName|schoolAndYear|presence', `Dernière AG  triée par présence`, `Affichage : Nom Complet - Ecole Année - Présence`, "<:triangle:1137394274816753695>"),
                createSelectionMenuOption('lastAG|sortByLastName|fullName|schoolAndYear|presence', `Dernière AG  triée par Nom A=>Z`, `Affichage : Nom Complet - Ecole Année - Présence`, "<:triangle:1137394274816753695>"),

                createSelectionMenuOption('DA|sortByUser|username|fullName|schoolAndYear', `Liste de la DA triée par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:bookmark:1137437120139640842>"),
                createSelectionMenuOption('DA|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste de la DA triée par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:bookmark:1137437120139640842>"),

                createSelectionMenuOption('Com|sortByUser|username|fullName|schoolAndYear', `Liste de la Com triée par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:pentool:1137435985186136195>"),
                createSelectionMenuOption('Com|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste de la Com trié triée par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:pentool:1137435985186136195>"),

                createSelectionMenuOption('Esport|sortByUser|username|fullName|schoolAndYear', `Liste du staff esport trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:crosshair:1137436482248904846>"),
                createSelectionMenuOption('Esport|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff esport trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:crosshair:1137436482248904846>"),

                createSelectionMenuOption('Partenariat|sortByUser|username|fullName|schoolAndYear', `Liste du staff partenariat trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:dollarsign:1137435764142116904>"),
                createSelectionMenuOption('Partenariat|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff partenariat trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:dollarsign:1137435764142116904>"),

                createSelectionMenuOption('Event|sortByUser|username|fullName|schoolAndYear', `Liste du staff event trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:speaker:1137428526178517033>"),
                createSelectionMenuOption('Event|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff event trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:speaker:1137428526178517033>"),

                createSelectionMenuOption('WebTV|sortByUser|username|fullName|schoolAndYear', `Liste du staff WebTV trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "<:video:1137424148352737310>"),
                createSelectionMenuOption('WebTV|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staffWebTV trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "<:video:1137424148352737310>"),
                
                ], 1, 1)])
            ]
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


