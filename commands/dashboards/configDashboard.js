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
            ).setColor('#f1c40f'))
        }

        message.channel.send({
            embeds: embedsArray,
            components: [createMessageActionRow([
                createEmojiButton('buttonRefreshUserDashboard', 'Mettre à jour les données', 'SUCCESS', '🔄'),
                createEmojiButton('buttonFixDatabaseData', 'Renvoyer le formulaire aux membres sans données', 'PRIMARY', '📨'),
                createEmojiButton('buttonKickMember', 'Radier un membre de la DB', 'DANGER', '🚫'),

            ]), createMessageActionRow([
                createButton('currentDisplay', `Affichage : Pseudo - Nom Complet - Role`, 'SUCCESS').setDisabled(true),
                createButton('currentSortFunction', `Tri : Par rôle hiérarchique`, 'SUCCESS').setDisabled(true),
                createButton('lastUpdate', `Dernière MAJ : ${getDateTime()}`, 'SECONDARY').setDisabled(true),

            ]), createMessageActionRow([createSelectionMenu('sortDashboardConfig', 'Affichages Disponibles', [
                createSelectionMenuOption('Users|sortByRole|username|fullName|memberRole', `Triez par role hiérarchique`, `Affichage : Pseudo - Nom Complet - Role`, "👥"),
                createSelectionMenuOption('Users|sortByMemberStatus|username|fullName|memberRole', `Trier ceux qui ont pas remplir leurs infos`, `Affichage : Pseudo - Nom Complet - Role`, "👥"),
                createSelectionMenuOption('Users|sortByUser|username|memberGeneralRole|memberSpecificRole', `Membres triés par pseudo A=>Z`, `Affichage : Pseudo - Catégorie - Pôle`, "👥"),
                createSelectionMenuOption('Users|sortByUser|username|fullName|schoolAndYear', `Membres triés par pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "👥"),
                createSelectionMenuOption('Users|sortByLastName|lastName|firstName|schoolAndYear', `Membres triés par Nom A=>Z`, `Affichage : Nom - Prénom - Ecole Année`, "👥"),

                createSelectionMenuOption('lastAG|sortByPresence|username|fullName|presence', `Dernière AG triée par présence`, `Affichage : Pseudo - Nom Complet - Présence`, "🔺"),
                createSelectionMenuOption('lastAG|sortByUser|username|fullName|presence', `Dernière AG triée par pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Présence`, "🔺"),
                createSelectionMenuOption('lastAG|sortByPresence|firstName|lastName|presence', `Dernière AG triée par présence`, `Affichage : Prénom - Nom - Présence`, "🔺"),
                createSelectionMenuOption('lastAG|sortByFirstName|firstName|lastName|presence', `Dernière AG triée par Prénom A=>Z`, `Affichage : Prénom - Nom - Présence`, "🔺"),
                createSelectionMenuOption('lastAG|sortByPresence|fullName|schoolAndYear|presence', `Dernière AG  triée par présence`, `Affichage : Nom Complet - Ecole Année - Présence`, "🔺"),
                createSelectionMenuOption('lastAG|sortByLastName|fullName|schoolAndYear|presence', `Dernière AG  triée par Nom A=>Z`, `Affichage : Nom Complet - Ecole Année - Présence`, "🔺"),

                createSelectionMenuOption('Joueurs|sortByUser|username|fullName|schoolAndYear', `Liste des joueurs triés par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "🕹"),
                createSelectionMenuOption('Joueurs|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste des joueurs triés par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Jeu`, "🕹"),

                createSelectionMenuOption('DA|sortByUser|username|fullName|schoolAndYear', `Liste de la DA triée par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "🎨"),
                createSelectionMenuOption('DA|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste de la DA triée par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "🎨"),

                createSelectionMenuOption('Com|sortByUser|username|fullName|schoolAndYear', `Liste de la Com triée par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "✒️"),
                createSelectionMenuOption('Com|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste de la Com trié triée par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "✒️"),

                createSelectionMenuOption('Esport|sortByUser|username|fullName|schoolAndYear', `Liste du staff esport trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "🎮"),
                createSelectionMenuOption('Esport|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff esport trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "🎮"),

                createSelectionMenuOption('Partenariat|sortByUser|username|fullName|schoolAndYear', `Liste du staff partenariat trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "💶"),
                createSelectionMenuOption('Partenariat|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff partenariat trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "💶"),

                createSelectionMenuOption('Event|sortByUser|username|fullName|schoolAndYear', `Liste du staff event trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "🎪"),
                createSelectionMenuOption('Event|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staff event trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "🎪"),

                createSelectionMenuOption('WebTV|sortByUser|username|fullName|schoolAndYear', `Liste du staff WebTV trié par Pseudo A=>Z`, `Affichage : Pseudo - Nom Complet - Ecole Année`, "🎥"),
                createSelectionMenuOption('WebTV|sortByFirstName|fullName|schoolAndYear|memberSpecificRole', `Liste du staffWebTV trié par Prénom A=>Z`, `Affichage : Nom Complet - Ecole Année - Sous pôle`, "🎥"),
                
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


