const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const { Modal, TextInputComponent, showModal} = require('discord-modals');
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updateEventEmbed} = require("../../../../utils/functions/teamsFunctions");
module.exports = class AddTrackerEvent extends BaseInteraction {
    constructor() {
        super('addTracker', 'smartManager', 'button', {
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
            .setCustomId('addTrackerModal')
            .setTitle('Ajouter des informations')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('trackerLink')
                    .setLabel('Lien du tracker')
                    .setPlaceholder('Ajoutez un lien vers le tracker des adversaires, OP.GG par exemple pour LoL')
                    .setStyle('SHORT')
                    .setRequired(true)
            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        });

        let modalResponse = await modalInteraction(interaction, modal.customId)

        // Check if link is valid
        if (!modalResponse.fields.components[0].components[0].value.includes('http')) return modalResponse.reply({
            content: '<:x_:1137419292946727042> Lien invalide',
            ephemeral: true
        })

        modalResponse.reply({
            content: '<:check:1137387353846063184> Informations ajoutées',
            ephemeral: true
        })

        event.trackerLink = modalResponse.fields.components[0].components[0].value
        let title
        switch (event.type) {
            case 'training':
                title = '<:zap:1137424324144410736> ` TRAINING `'
                break
            case 'entrainement':
                title = '<:zap:1137424324144410736> ` ENTRAINEMENT `'
                break
            case 'pracc':
                title = '<:crosshair:1137436482248904846> ` PRACC : BOOKED`'
                break
            case 'tournament':
                title = '<:flag:1153289152536772659> ` TOURNAMENT `'
                break
            case 'scrim':
                title = '<:zap2:1137424322399571988> ` SCRIM : BOOKED`'
                break
            case 'team-building':
                title = '<:users:1137390672194850887> ` TEAM BUILDING `'
                break
            case 'review':
                title = '<:search:1153289155405680721> ` REVIEW `'
                break
            default:
                title = '<:calendar:1137424147056689293> ` EVENT `'
                break
        }
        event.name = title
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