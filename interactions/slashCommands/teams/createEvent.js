const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const {SlashCommandBuilder} = require("@discordjs/builders");
const Teams = require("../../../src/schemas/TeamSchema");
const {Modal, TextInputComponent, showModal} = require("discord-modals");
const {modalInteraction} = require("../../../utils/functions/awaitFunctions");
const {minutesToHHMM} = require("../../../utils/functions/systemFunctions");
const {Types} = require("mongoose");
const {createEmojiButton, createMessageActionRow} = require("../../../utils/functions/messageComponents");
const {MessageEmbed} = require("discord.js");
const { DateTime } = require('luxon');

module.exports = class CreateEventCommand extends BaseInteraction {
    constructor() {
        super('create-event', 'teams', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('create-event')
                .setDescription('Crée un événement')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type d\'événement')
                        .setRequired(true)
                        .addChoices([
                            ['Entrainement', 'entrainement'],
                            ['Pracc', 'pracc'],
                            ['Scrim', 'scrim'],
                            ['Team building', 'team-building'],
                            ['Review', 'review'],
                            ['Tournament', 'tournament'],
                            ])
                )
        })
    }

    async run(client, interaction) {
        let parentCategoryId = interaction.channel.parent.id
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous devez lancez cette commande dans un channel de team',
            ephemeral: true
        });

        if (!interaction.member.roles.cache.has('624715536693198888')) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous n\'avez pas la permission pour executer cette commande',
            ephemeral: true
        });

        let organisationChannel = interaction.channel.parent.children.find(channel => channel.name.includes('organisation'))

        let modal = new Modal()
            .setCustomId('createEventModal')
            .setTitle('Créer un événement')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('date')
                    .setLabel('Date')
                    .setPlaceholder('Ajoutez une date au format JJ/MM HH:MM')
                    .setStyle('SHORT')
                    .setRequired(true),

                new TextInputComponent()
                    .setCustomId('duration')
                    .setLabel('Durée')
                    .setPlaceholder('Ajoutez la durée de l\'événement, en minutes')
                    .setStyle('SHORT')
                    .setRequired(true),

                new TextInputComponent()
                    .setCustomId('nb_games')
                    .setLabel('Nombre de games')
                    .setPlaceholder('Ajoutez le nombre de games de l\'événement')
                    .setStyle('SHORT'),

                new TextInputComponent()
                    .setCustomId('nb_players')
                    .setLabel('Nombre de joueurs')
                    .setPlaceholder('Ajoutez le nombre de joueurs de l\'événement')
                    .setStyle('SHORT')
                    .setRequired(true),

                new TextInputComponent()
                    .setCustomId('name')
                    .setLabel('Nom')
                    .setPlaceholder('Ajoutez le nom de l\'événement')
                    .setStyle('SHORT')
                    .setRequired(true)
            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        });

        let modalResponse = await modalInteraction(interaction, modal.customId)

        let event = {
            attendance: true
        }
        if (modalResponse.fields.components[0].components[0].value) {
            // Parse the date and check if it's valid
            let date = modalResponse.fields.components[0].components[0].value
            let dateRegex = new RegExp('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012]) (?:[01]\\d|2[0123]):[012345]\\d$')
            if (!dateRegex.test(date)) return modalResponse.reply({
                content: '<:x_:1137419292946727042> Date invalide, format attendu: JJ/MM HH:MM',
                ephemeral: true
            })

            // Transform to discordJS timestamp
            const parisDateTime = DateTime.fromFormat(date, 'dd/MM HH:mm', {zone: 'Europe/Paris'});

            event.discordTimestamp = parisDateTime.toSeconds()
        }

        if (modalResponse.fields.components[1].components[0].value) {
            let duration = modalResponse.fields.components[1].components[0].value
            if (isNaN(duration)) return modalResponse.reply({
                content: '<:x_:1137419292946727042> Durée invalide',
                ephemeral: true
            })
            event.duration = duration
        }

        if (modalResponse.fields.components[2].components[0].value) {
            let nbGames = modalResponse.fields.components[2].components[0].value
            if (isNaN(nbGames)) return modalResponse.reply({
                content: '<:x_:1137419292946727042> Nombre de games invalide',
                ephemeral: true
            });
            event.nbGames = nbGames
        } else {
            event.nbGames = 0
        }

        if (modalResponse.fields.components[3].components[0].value) {
            let nbPlayers = modalResponse.fields.components[3].components[0].value
            if (isNaN(nbPlayers)) return modalResponse.reply({
                content: '<:x_:1137419292946727042> Nombre de joueurs invalide',
                ephemeral: true
            });
            event.slots = nbPlayers
        } else {
            event.slots = Team.minPlayers
        }

        let title
        let type = interaction.options.getString('type')
        let name = modalResponse.fields.components[4].components[0].value
        switch (type) {
            case 'training':
                title = '<:zap:1137424324144410736> ` ' + name + ' `'
                event.type = 'training'
                break
            case 'entrainement':
                title = '<:zap:1137424324144410736> ` ' + name + ' `'
                event.type = 'entrainement'
                break
            case 'pracc':
                title = '<:crosshair:1137436482248904846> ` ' + name + ' `'
                event.type = 'pracc'
                break
            case 'tournament':
                title = '<:flag:1153289152536772659> ` ' + name + ' `'
                event.type = 'tournament'
                break
            case 'scrim':
                title = '<:zap2:1137424322399571988> ` ' + name + ' `'
                event.type = 'scrim'
                break
            case 'team-building':
                title = '<:users:1137390672194850887> ` ' + name + ' `'
                event.type = 'team-building'
                break
            case 'review':
                title = '<:search:1153289155405680721> ` ' + name + ' `'
                event.type = 'review'
                break
            default:
                title = '<:calendar:1137424147056689293> ` ' + name + ' `'
                event.type = 'event'
                break
        }

        const myId = Types.ObjectId();
        event._id = myId
        event.name = title


        let buttonAccept = createEmojiButton(`acceptEvent|${myId}`, '', 'SECONDARY', '<:usercheck:1137390666490589274>')
        let buttonMaybe = createEmojiButton(`maybeEvent|${myId}`, '', 'SECONDARY', '<:userplus3:1153405260812005547>')
        let buttonDecline = createEmojiButton(`declineEvent|${myId}`, '', 'SECONDARY', '<:userx:1137394869812351006>')
        let buttonSettings = createEmojiButton(`eventSettings|${myId}`, '', 'SECONDARY', '<:settings2:1153405967409623141>')



        let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${event.discordTimestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(event.duration)}\n`

        if (type !== 'review' && type !== 'team-building' && type !== 'tournament') {
            embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.nbGames}\n`
        }
        embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` 0/${event.slots}`

        let eventEmbed = new MessageEmbed()
            .setTitle(title)
            .setColor('#2b2d31')
            .setDescription(embedDescription)

        eventEmbed.addFields([
            {
                name: '<:check:1137390614296678421> ` CONFIRMES `',
                value: '\u200b',
                inline: true
            },
            {
                name: '<:users:1137390672194850887> ` PEUT-ÊTRE `',
                value: '\u200b',
                inline: true
            },
            {
                name: '<:x_:1137419292946727042> ` INDISPONIBLES `',
                value: '\u200b',
                inline: true
            }
        ])
        let message = await organisationChannel.send({
            content: "<@&" + Team.linkedRoleId + ">",
            embeds: [eventEmbed],
            components: [
                createMessageActionRow([buttonAccept, buttonMaybe, buttonDecline, buttonSettings])
            ]
        })

        modalResponse.reply({
            content: '<:check:1137387353846063184> Événement créé',
            ephemeral: true
        })

        event.messageId = message.id
        Team.events.push(event)
        await Team.save()
    }
}