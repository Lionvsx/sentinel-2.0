const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const { Modal, TextInputComponent, showModal} = require('discord-modals');
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updateEventEmbed} = require("../../../../utils/functions/teamsFunctions");
const {MessageEmbed} = require("discord.js");
const {DateTime} = require("luxon");
module.exports = class EditEvent extends BaseInteraction {
    constructor() {
        super('editEvent', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let parentCategoryId = interaction.channel.parent.id
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        if (!interaction.member.roles.cache.has('624715536693198888')) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous n\'avez pas la permission pour executer cette commande',
            ephemeral: true
        });

        let event = Team.events.find(event => String(event._id) === buttonArgs[1])
        if (!event) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        let modal = new Modal()
            .setCustomId('editEventModal')
            .setTitle('Changez les informations')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('date')
                    .setLabel('Date')
                    .setPlaceholder('Ajoutez une date au format JJ/MM HH:MM')
                    .setStyle('SHORT'),

                new TextInputComponent()
                    .setCustomId('duration')
                    .setLabel('Durée')
                    .setPlaceholder('Ajoutez la nouvelle durée de l\'événement, en minutes')
                    .setStyle('SHORT'),

                new TextInputComponent()
                    .setCustomId('nb_games')
                    .setLabel('Nombre de games')
                    .setPlaceholder('Ajoutez le nouveau nombre de games de l\'événement')
                    .setStyle('SHORT'),

                new TextInputComponent()
                    .setCustomId('nb_players')
                    .setLabel('Nombre de joueurs')
                    .setPlaceholder('Ajoutez le nouveau nombre de joueurs de l\'événement')
                    .setStyle('SHORT'),

                new TextInputComponent()
                    .setCustomId('name')
                    .setLabel('Nom')
                    .setPlaceholder('Ajoutez le nouveau nom de l\'événement')
                    .setStyle('SHORT')
            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        });

        let modalResponse = await modalInteraction(interaction, modal.customId)

        if (modalResponse.fields.components[0].components[0].value) {
            // Parse the date and check if it's valid
            let date = modalResponse.fields.components[0].components[0].value
            let dateRegex = new RegExp('^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012]) (?:[01]\\d|2[0123]):(?:[012345]\\d)$')
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
        }

        if (modalResponse.fields.components[3].components[0].value) {
            let nbPlayers = modalResponse.fields.components[3].components[0].value
            if (isNaN(nbPlayers)) return modalResponse.reply({
                content: '<:x_:1137419292946727042> Nombre de joueurs invalide',
                ephemeral: true
            });
            event.slots = nbPlayers
        }

        if (modalResponse.fields.components[4].components[0].value) {
            switch (event.type) {
                case 'training':
                    event.name = '<:zap:1137424324144410736> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'pracc':
                    event.name = '<:crosshair:1137436482248904846> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'tournament':
                    event.name = '<:flag:1153289152536772659> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'scrim':
                    event.name = '<:zap2:1137424322399571988> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'team-building':
                    event.name = '<:users:1137390672194850887> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'review':
                    event.name = '<:search:1153289155405680721> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                case 'entrainement':
                    event.name = '<:zap:1137424324144410736> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
                default:
                    event.name = '<:calendar:1137424147056689293> ` ' + modalResponse.fields.components[4].components[0].value + ' `'
                    break
            }
        }

        modalResponse.reply({
            content: '<:check:1137387353846063184> Informations modifiées',
            ephemeral: true
        })

        let eventParticipants = event.rsvps.map(rsvp => rsvp.userId)
        for (const participant of eventParticipants) {
            let user = await client.users.fetch(participant)
            let dmChannel = await user.createDM()
            dmChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<:editpen:1137390632445431950> L'événement ${event.name} a été modifié et débute <t:${event.discordTimestamp}:R>`)
                        .setColor("#2b2d31")
                ]
            })
        }

        await Team.save()

        let eventEmbed = updateEventEmbed(event)

        if (interaction.message.components[1]) {
            interaction.message.components.splice(1, 1)
        }

        // Update the message
        interaction.message.edit({
            embeds: [eventEmbed],
            components: interaction.message.components
        })
    }
}