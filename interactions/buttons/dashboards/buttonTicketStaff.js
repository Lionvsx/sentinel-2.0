const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation, askYesOrNo, userResponseContent } = require('../../../utils/functions/awaitFunctions')
const { getUsersFromString } = require('../../../utils/functions/utilitaryFunctions')
const { createButtonActionRow, createButton } = require('../../../utils/functions/messageComponents')
const { MessageEmbed, Permissions } = require('discord.js')
const mongoose = require('mongoose')
const Ticket = require('../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../utils/services/discordLoggerService')
const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')

const StaffChannels = new Map([
    ['da', '741810218081583244'],
    ['com', '742403805290692650'],
    ['event', '742403832059002912'],
    ['webtv', '741961837834403930'],
    ['bureau', '742403764211679342'],
    ['stafftechnique', '742404106676862996']
]);

module.exports = class TicketStaffButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonTicketStaff', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })
        const dmChannel = await interaction.user.createDM()
        const embedTicketSelection = new MessageEmbed()
            .setDescription(`Bonjour \`${interaction.user.username}\`\nQuel type de ticket voulez vous créer?`)
            .addFields(
                { name: '💬', value: "Ticket Communication", inline: true },
                { name: '🎪', value: "Ticket Staff Event", inline: true },
                { name: '❌', value: "Annulez la commande", inline: true },
            )
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        const ticketSelectionInteraction = await reactionEmbedSelector(dmChannel, ['💬', '🎪', '❌'], embedTicketSelection).catch(err => console.log(err))
        if (!ticketSelectionInteraction) return
        const emoji = ticketSelectionInteraction.customId

        const ResponsableWebTV = mongoose.model('User').findOne({ roleResponsable: 'webtv' })
        const ResponsableDA = mongoose.model('User').findOne({ roleResponsable: 'da' })
        const ResponsableCOM = mongoose.model('User').findOne({ roleResponsable: 'com' })
        const ResponsableEVENT = mongoose.model('User').findOne({ roleResponsable: 'event' })

        const allChannels = interaction.guild.channels.cache

        switch(emoji) {
            case '💬':
                selectorReply(ticketSelectionInteraction, emoji, 'Ticket Communication')
                
                const ticketPermissions = [{ id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }, { id: '743052360368259093', allow: [Permissions.FLAGS.VIEW_CHANNEL] }, {id: interaction.guild.roles.everyone.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] }]
                const accessChannelsAudience = [StaffChannels.get('da'), StaffChannels.get('com')]

                const ticketName = await userResponseContent(dmChannel, "Veuillez donner un nom à votre ticket :").catch(err => console.log(err))
                if (!ticketName) return;
                const ticketGame = await userResponseContent(dmChannel, "Veuillez entrer un jeu associé au ticket de communication : \`(Si la communication ne comporte pas de jeu spécifique, tapez \"aucun\")\`").catch(err => console.log(err))
                if (!ticketGame) return;
                const teamOrPlayers = await userResponseContent(dmChannel, "Veuillez spécifier l'/les équipe(s) ou joueurs concernés dans ce ticket : \`(Si la communication ne comporte pas de joueur spécifique, tapez \"aucun\")\`").catch(err => console.log(err))
                if (!teamOrPlayers) return;
                const eventFullName = await userResponseContent(dmChannel, "Veuillez entrer le nom complet de l'evenement associé à la communication :").catch(err => console.log(err))
                if (!eventFullName) return;
                const eventTime = await userResponseContent(dmChannel, "Veuillez renseigner la date et l'heure de l'evenement ou de la premiere itération de l'evenement : \`(Exemple : Date Heure d'un tournoi ou de la premiere étape du tournoi)\`").catch(err => console.log(err))
                if (!eventTime) return;
                const links = await userResponseContent(dmChannel, "Avez vous des liens utiles à renseigner liés a l'event? \`(Si aucun tapez \"aucun\")\`").catch(err => console.log(err))
                if (!links) return;
                const webTVBoolean = await askYesOrNo(dmChannel, `Souhaitez vous une couverture de l'evenement par la Web TV?`).catch(err => console.log(err))
                if (!webTVBoolean) return
                const userToAddString = await userResponseContent(dmChannel, "Quels autres utilisateurs souhaitez vous rajouter au ticket : \`(pseudos discord séparés d'une virgule, tapez \"aucun\" si il n'y en a aucun)\`").catch(err => console.log(err))
                if (!userToAddString) return;


                if (webTVBoolean) {
                    if (ResponsableWebTV && ResponsableWebTV.discordId) ticketPermissions.push({ id: ResponsableWebTV.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] })
                    accessChannelsAudience.push(StaffChannels.get('webtv'))
                }
                let usersAudience = undefined
                if (userToAddString.toLowerCase() != 'aucun') {
                    usersAudience = await getUsersFromString(interaction.guild, userToAddString.split(/\s*[,]\s*/))
                    if (usersAudience.length === 0) return
                    for (const member of usersAudience) {
                        ticketPermissions.push({ id: member.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
                    }
                }

                ResponsableCOM && ResponsableCOM.discordId ? ticketPermissions.push({ id: ResponsableCOM.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] }) : null
                ResponsableDA && ResponsableDA.discordId ? ticketPermissions.push({ id: ResponsableDA.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL]}) : null

                const ticketEmbed = new MessageEmbed()
                    .setTitle(eventFullName.toUpperCase())
                    .addFields(
                        { name: '🎮 | JEU', value: ticketGame},
                        { name: '⭐ | EQUIPE / JOUEURS', value: teamOrPlayers},
                        { name: '📆 | DATE', value: eventTime},
                        { name: '🔗 | LIENS', value: links},
                        { name: '🎥 | CAST', value: webTVBoolean ? 'Oui' : 'Non'},
                    )
                const accessEmbed = new MessageEmbed()
                    .setTitle(`🎫 NOUVEAU TICKET : \`${ticketName}\``)
                    .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nNom de l'event : \`${eventFullName}\`\nJeu associé : \`${ticketGame}\`\nDate : \`${eventTime}\``)
                    .setTimestamp()


                //CONFIRMATION
                const confirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir ouvrir un ticket avec les paramètres suivants : \`\`\`NOM: ${ticketName}\nJEU: ${ticketGame}\nTEAM / JOUEURS: ${teamOrPlayers}\nLIENS: ${links}\nCAST: ${webTVBoolean ? 'OUI' : 'NON'}\n\nUTILISATEURS ADDITIONNELS:\n${usersAudience ? usersAudience.map(member => member.user.tag).join('\n') : 'Aucun'} \`\`\``).catch(err => console.log(err))
                if (!confirmation || confirmation === false) return
                ticketLogger.setLogData(`NOM: ${ticketName}\nJEU: ${ticketGame}\nTEAM / JOUEURS: ${teamOrPlayers}\nLIENS: ${links}\nCAST${webTVBoolean ? 'OUI' : 'NON'}`)

                const newChannel = await interaction.guild.channels.create(`🎫┃${ticketName}`, {
                    type: 'GUILD_TEXT',
                    position: 100,
                    permissionOverwrites: ticketPermissions,
                    parent: allChannels.find(channel => channel.name.includes('📨tickets📨') && channel.type === 'GUILD_CATEGORY')
                })
                await newChannel.send({
                    content: '@everyone',
                    embeds: [ticketEmbed]
                })
                Ticket.create({
                    ticketChannelId: newChannel.id,
                    guildId: newChannel.guild.id,
                    authorId: interaction.user.id,
                    name: ticketName
                })
                for (const channelId of accessChannelsAudience) {
                    let requestChannel = allChannels.get(channelId)
                    await requestChannel.send({
                        embeds: [accessEmbed],
                        components: [createButtonActionRow([createButton(`buttonAccessChannel|${newChannel.id}`, 'Accédez au ticket', 'SUCCESS'), createButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'DANGER')])]
                    })
                }

                ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket de **communication** avec les paramètres suivants :`)

                break;
            case '🎪':
                selectorReply(ticketSelectionInteraction, emoji, 'Ticket Staff Event')
                const eventTicketPermissions = [{ id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }, { id: '743052360368259093', allow: [Permissions.FLAGS.VIEW_CHANNEL] }, {id: interaction.guild.roles.everyone.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] }]
                const eventAccessChannelsAudience = [StaffChannels.get('event')]

                const eventTicketName = await userResponseContent(dmChannel, "Veuillez donner un nom à votre ticket :").catch(err => console.log(err))
                if (!eventTicketName) return
                const eventTicketFullName = await userResponseContent(dmChannel, "Veuillez entrez le nom complet de l'evenement :").catch(err => console.log(err))
                if (!eventTicketFullName) return
                const eventTicketTime = await userResponseContent(dmChannel, "Veuillez renseigner la date et l'heure de l'evenement :").catch(err => console.log(err))
                if (!eventTicketName) return
                const eventWebTVBoolean = await askYesOrNo(dmChannel, `Souhaitez vous une couverture de l'evenement par la Web TV?`).catch(err => console.log(err))
                if (!eventWebTVBoolean) return
                const comBoolean = await askYesOrNo(dmChannel, `Souhaitez vous que le staff communication soit inclus dans le ticket de l'evenement?`).catch(err => console.log(err))
                if (!comBoolean) return
                const daBoolean = await askYesOrNo(dmChannel, `Souhaitez vous que le staff direction artistique soit inclus dans le ticket de l'evenement?`).catch(err => console.log(err))
                if (!daBoolean) return
                const eventUserToAddString = await userResponseContent(dmChannel, "Quels autres utilisateurs souhaitez vous rajouter au ticket : \`(pseudos discord séparés d'une virgule, tapez \"aucun\" si il n'y en a aucun)\`").catch(err => console.log(err))
                if (!eventUserToAddString) return


                let eventUsersAudience = undefined
                if (eventUserToAddString.toLowerCase() != 'aucun') {
                    eventUsersAudience = await getUsersFromString(interaction.guild, eventUserToAddString.split(/\s*[,]\s*/))
                    if (eventUsersAudience.length === 0) return
                    for (const member of eventUsersAudience) {
                        eventTicketPermissions.push({ id: member.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
                    }
                }
                break;
            case '❌':
                selectorReply(ticketSelectionInteraction, emoji, 'Commande annulée')
                break;
            default: 
                break;
        }
    }
}

