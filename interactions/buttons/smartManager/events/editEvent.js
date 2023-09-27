const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const { Modal, TextInputComponent, showModal} = require('discord-modals');
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updateEventEmbed} = require("../../../../utils/functions/teamsFunctions");
const {getParisUTCOffset} = require("../../../../utils/functions/systemFunctions");
const {MessageEmbed} = require("discord.js");
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
            let dateArray = date.split(' ')
            let dateArray2 = dateArray[0].split('/')
            let dateArray3 = dateArray[1].split(':')
            let currentYear = new Date().getFullYear()
            let offset = getParisUTCOffset()
            let dateTimestamp = new Date(currentYear, dateArray2[1] - 1, dateArray2[0], dateArray3[0] - offset, dateArray3[1]).getTime()

            event.discordTimestamp = dateTimestamp / 1000
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
                        .setDescription(`<:editpen:1137390632445431950> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été modifié et commence maintenant <t:${unixTimestamp}:R>`)
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