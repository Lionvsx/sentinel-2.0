const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation, askYesOrNo, userResponseContent, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString } = require('../../../../utils/functions/utilitaryFunctions')
const { createButtonActionRow, createButton, createSelectionMenu, createSelectionMenuOption, createMessageActionRow } = require('../../../../utils/functions/messageComponents')
const { MessageEmbed, Permissions } = require('discord.js')
const mongoose = require('mongoose')
const Ticket = require('../../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')


const StaffChannels = new Map([
    ['da', '741810218081583244'],
    ['com', '742403805290692650'],
    ['event', '742403832059002912'],
    ['webtv', '741961837834403930'],
    ['bureau', '742403764211679342'],
    ['stafftechnique', '742404106676862996'],
    ['partenariat', '894736357241544774'],
    ['esport', '898532117292666910']
]);

module.exports = class TicketStaffButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonTicketStaff', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()
        const dmChannel = await interaction.user.createDM()
        const embedTicketSelection = new MessageEmbed()
            .setDescription(`Bonjour \`${interaction.user.username}\`\nQuel type de ticket voulez vous créer?`)
            .addFields(
                { name: '💬', value: "Ticket Communication (Tournoi, Esport)", inline: true },
                { name: '🎪', value: "Ticket Staff Event (Evenement Associatif)", inline: true },
                { name: '🔗', value: "Ticket Pôles (Uniquement à certains pôles)", inline: true },
                { name: '❌', value: "Annulez la commande", inline: true },
            )

        const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        const loading = client.emojis.cache.get('741276138319380583')

        const ticketSelectionInteraction = await reactionEmbedSelector(dmChannel, ['💬', '🎪', '🔗', '❌'], embedTicketSelection).catch(err => console.log(err))
        if (!ticketSelectionInteraction) return
        const emoji = ticketSelectionInteraction.customId

        const ResponsableWebTV = await mongoose.model('User').findOne({ roleResponsable: 'webtv' })
        const ResponsableDA = await mongoose.model('User').findOne({ roleResponsable: 'da' })
        const ResponsableCOM = await mongoose.model('User').findOne({ roleResponsable: 'com' })
        const ResponsableEVENT = await mongoose.model('User').findOne({ roleResponsable: 'event' })
        const ResponsablePARTENARIAT = await mongoose.model('User').findOne({ roleResponsable: 'partenariat' })
        const ResponsableESPORT = await mongoose.model('User').findOne({ roleResponsable: 'esport' })

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
                if (webTVBoolean === undefined) return
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
                    .setColor('#fdcb6e')
                const accessEmbed = new MessageEmbed()
                    .setTitle(`🎫 NOUVEAU TICKET : \`${ticketName}\``)
                    .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nNom de l'event : \`${eventFullName}\`\nJeu associé : \`${ticketGame}\`\nDate : \`${eventTime}\``)
                    .setTimestamp()
                    .setColor('#3498db')


                //CONFIRMATION
                const confirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir ouvrir un ticket avec les paramètres suivants : \`\`\`NOM: ${ticketName}\nJEU: ${ticketGame}\nTEAM / JOUEURS: ${teamOrPlayers}\nLIENS: ${links}\nCAST: ${webTVBoolean ? 'OUI' : 'NON'}\n\nUTILISATEURS ADDITIONNELS:\n${usersAudience ? usersAudience.map(member => member.user.tag).join('\n') : 'Aucun'} \`\`\``).catch(err => console.log(err))
                if (!confirmation || confirmation === false) return
                ticketLogger.setLogData(`NOM: ${ticketName}\nJEU: ${ticketGame}\nTEAM / JOUEURS: ${teamOrPlayers}\nLIENS: ${links}\nCAST${webTVBoolean ? 'OUI' : 'NON'}`)

                const tempMsg = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)

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
                const newTicket = await Ticket.create({
                    ticketChannelId: newChannel.id,
                    guildId: newChannel.guild.id,
                    authorId: interaction.user.id,
                    name: ticketName
                })
                client.allTickets.set(newTicket.ticketChannelId, newTicket);
                for (const channelId of accessChannelsAudience) {
                    let requestChannel = allChannels.get(channelId)
                    await requestChannel.send({
                        embeds: [accessEmbed],
                        components: [createButtonActionRow([createButton(`buttonAccessChannel|${newChannel.id}`, 'Accédez au ticket', 'SUCCESS'), createButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'DANGER')])]
                    })
                }

                ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket de **communication** avec les paramètres suivants :`)
                tempMsg.edit(`**:white_check_mark: | **Votre ticket a été crée avec succès!`)

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
                if (!eventTicketTime) return
                const eventWebTVBoolean = await askYesOrNo(dmChannel, `Souhaitez vous une couverture de l'evenement par la Web TV?`).catch(err => console.log(err))
                if (eventWebTVBoolean === undefined) return
                const comBoolean = await askYesOrNo(dmChannel, `Souhaitez vous que le staff communication soit inclus dans le ticket de l'evenement?`).catch(err => console.log(err))
                if (comBoolean === undefined) return
                const daBoolean = await askYesOrNo(dmChannel, `Souhaitez vous que le staff direction artistique soit inclus dans le ticket de l'evenement?`).catch(err => console.log(err))
                if (daBoolean === undefined) return
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

                ResponsableEVENT && ResponsableEVENT.discordId ? eventTicketPermissions.push({ id: ResponsableEVENT.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] }) : null

                if (eventWebTVBoolean) {
                    if (ResponsableWebTV && ResponsableWebTV.discordId) eventTicketPermissions.push({ id: ResponsableWebTV.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] })
                    eventAccessChannelsAudience.push(StaffChannels.get('webtv'))
                }
                if (comBoolean) {
                    if (ResponsableCOM && ResponsableCOM.discordId) eventTicketPermissions.push({ id: ResponsableCOM.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] })
                    eventAccessChannelsAudience.push(StaffChannels.get('com'))
                }
                if (daBoolean) {
                    if (ResponsableDA && ResponsableDA.discordId) eventTicketPermissions.push({ id: ResponsableDA.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] })
                    eventAccessChannelsAudience.push(StaffChannels.get('da'))
                }
                const ticketEventEmbed = new MessageEmbed()
                    .setTitle(eventTicketFullName.toUpperCase())
                    .setDescription(`🎪 Nouveau ticket évenementiel crée, request envoyée au staff event !`)
                    .addFields(
                        { name: '📆 | DATE', value: eventTicketTime},
                        { name: '🎥 | WEBTV', value: eventWebTVBoolean ? 'Oui' : 'Non'},
                        { name: '📱 | COMMUNICATION', value: comBoolean ? 'Oui' : 'Non'},
                        { name: '🎨 | DA', value: daBoolean ? 'Oui' : 'Non'},
                    )
                const eventAccessEmbed = new MessageEmbed()
                    .setTitle(`🎪 NOUVEAU TICKET EVENEMENT : \`${eventTicketName}\``)
                    .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nNom de l'event : \`${eventTicketFullName}\`\nDate : \`${eventTicketTime}\``)
                    .setTimestamp()
                    .setColor('#f39c12')

                const ticketEventConfirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir ouvrir un ticket avec les paramètres suivants : \`\`\`NOM: ${eventTicketName}}\nDATE: ${eventTicketTime}\nWEBTV: ${eventWebTVBoolean ? 'OUI' : 'NON'}\nCOM: ${comBoolean ? 'OUI' : 'NON'}\nDA: ${daBoolean ? 'OUI' : 'NON'} \n\nUTILISATEURS ADDITIONNELS:\n${eventUsersAudience ? eventUsersAudience.map(member => member.user.tag).join('\n') : 'Aucun'} \`\`\``).catch(err => console.log(err))
                if (!ticketEventConfirmation || ticketEventConfirmation === false) return
                ticketLogger.setLogData(`NOM: ${eventTicketName}}\nDATE: ${eventTicketTime}\nWEBTV: ${eventWebTVBoolean ? 'OUI' : 'NON'}\nCOM: ${comBoolean ? 'OUI' : 'NON'}\nDA: ${daBoolean ? 'OUI' : 'NON'}`)

                const tempMsgEvent = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)

                const newEventTicketChannel = await interaction.guild.channels.create(`🎪┃${eventTicketName}`, {
                    type: 'GUILD_TEXT',
                    position: 100,
                    permissionOverwrites: eventTicketPermissions,
                    parent: allChannels.find(channel => channel.name.includes('📨tickets📨') && channel.type === 'GUILD_CATEGORY')
                })
                await newEventTicketChannel.send({
                    content: '@everyone',
                    embeds: [ticketEventEmbed]
                })
                const newEventDBTicket = await Ticket.create({
                    ticketChannelId: newEventTicketChannel.id,
                    guildId: newEventTicketChannel.guild.id,
                    authorId: interaction.user.id,
                    name: eventTicketName
                })
                await client.allTickets.set(newEventDBTicket.ticketChannelId, newEventDBTicket);
                for (const channelId of eventAccessChannelsAudience) {
                    let requestChannel = allChannels.get(channelId)
                    await requestChannel.send({
                        embeds: [eventAccessEmbed],
                        components: [createButtonActionRow([createButton(`buttonAccessChannel|${newEventTicketChannel.id}`, 'Accédez au ticket', 'SUCCESS'), createButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'DANGER')])]
                    })
                }

                ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket de **évènementiel** avec les paramètres suivants :`)
                tempMsgEvent.edit(`**:white_check_mark: | **Votre ticket a été crée avec succès!`)
                break;
            case '🔗':
                selectorReply(ticketSelectionInteraction, emoji, 'Ticket requête')
                const ticketRequestPermissions = [{ id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }, { id: '743052360368259093', allow: [Permissions.FLAGS.VIEW_CHANNEL] }, {id: interaction.guild.roles.everyone.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] }]

                const requestSelectionMenu = createSelectionMenu('ticketSelectionMenu', 'Selectionnez 1 ou plusieurs pôles', [
                    createSelectionMenuOption('webtv', 'Web TV', undefined, '🎥'),
                    createSelectionMenuOption('da', 'Direction Artistique', undefined, '🎨'),
                    createSelectionMenuOption('com', 'Communication', undefined, '✒️'),
                    createSelectionMenuOption('event', 'Event', undefined, '🎪'),
                    createSelectionMenuOption('esport', 'Esport', undefined, '🎮'),
                    createSelectionMenuOption('partenariat', 'Partenariat', undefined, '💶')
                ], 1, 6)

                const menuMessage = await dmChannel.send({
                    embeds: [new MessageEmbed().setDescription('🔽 A quels pôles voulez vous envoyer votre requête 🔽').setColor('#00b894')],
                    components: [createMessageActionRow([requestSelectionMenu])]
                })
    
                const selectionMenuInteraction = await menuInteraction(menuMessage).catch(err => console.log(err))
                if (!selectionMenuInteraction) return;
                const selectionMenuComponent = (await selectionMenuInteraction)?.component
                const selectedOptions = selectionMenuComponent.options.filter(option => selectionMenuInteraction.values.join('').includes(option.value))

                selectionMenuInteraction.update({
                    embeds: [new MessageEmbed().setDescription(`✅ Selectionné : \`${selectionMenuInteraction.values.length}\` option(s) ✅\n\`\`\`\n${selectedOptions.map(option => option.label).join('\n')}\`\`\``).setColor('#00b894')],
                    components: [createMessageActionRow([selectionMenuComponent.setDisabled(true)])]
                })
                

                const requestAccessChannelAudience = []
                for (const option of selectionMenuInteraction.values) {
                    requestAccessChannelAudience.push(StaffChannels.get(option))
                }
                const ticketRequestName = await userResponseContent(dmChannel, "Veuillez donner un nom à votre ticket :").catch(err => console.log(err))
                if (!ticketRequestName) return;
                const ticketRequestObject = await userResponseContent(dmChannel, "Quel est l'object de votre requête (description courte) :").catch(err => console.log(err))
                if (!ticketRequestObject) return;

                const tempMsgRequest = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)

                const requestAccessEmbed = new MessageEmbed()
                    .setTitle(`🔗 NOUVEAU TICKET : \`${ticketRequestName}\``)
                    .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nObject de la requête : \`\`\`${ticketRequestObject}\`\`\``)
                    .setTimestamp()
                    .setColor('#9b59b6')
                
                const newRequestTicketChannel = await interaction.guild.channels.create(`🔗┃${ticketRequestName}`, {
                    type: 'GUILD_TEXT',
                    position: 100,
                    permissionOverwrites: ticketRequestPermissions,
                    parent: allChannels.find(channel => channel.name.includes('📨tickets📨') && channel.type === 'GUILD_CATEGORY')
                })
                await newRequestTicketChannel.send({
                    content: '@everyone',
                    embeds: [new MessageEmbed().setDescription(`Ticket requête ouvert pour les pôles suivants: \n\`\`\`${selectedOptions.map(option => option.label).join('\n')}\`\`\``)]
                })
                const newRequestDBTicket = await Ticket.create({
                    ticketChannelId: newRequestTicketChannel.id,
                    guildId: newRequestTicketChannel.guild.id,
                    authorId: interaction.user.id,
                    name: ticketRequestName
                })
                client.allTickets.set(newRequestDBTicket.ticketChannelId, newRequestDBTicket)
                for (const channelId of requestAccessChannelAudience) { 
                    let requestChannel = allChannels.get(channelId)
                    await requestChannel.send({
                        embeds: [requestAccessEmbed],
                        components: [createButtonActionRow([createButton(`buttonAccessChannel|${newRequestTicketChannel.id}`, 'Accédez au ticket', 'SUCCESS'), createButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'DANGER')])]
                    })
                }

                tempMsgRequest.edit(`**:white_check_mark: | **Votre ticket a été crée avec succès!`)

                break;
            case '❌':
                selectorReply(ticketSelectionInteraction, emoji, 'Commande annulée')
                break;
            default: 
                break;
        }
    }
}

