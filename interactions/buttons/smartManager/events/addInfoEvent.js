const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const { Modal, TextInputComponent, showModal} = require('discord-modals');
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updateEventEmbed} = require("../../../../utils/functions/teamsFunctions");
module.exports = class AddInfoEvent extends BaseInteraction {
    constructor() {
        super('addInfoEvent', 'smartManager', 'button', {
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
            .setCustomId('addInfoModal')
            .setTitle('Ajouter des informations')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('infos')
                    .setLabel('Informations')
                    .setPlaceholder('Ajoutez les informations que vous souhaitez partager avec les participants')
                    .setStyle('LONG')
                    .setRequired(true)
            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        });

        let modalResponse = await modalInteraction(interaction, modal.customId)

        modalResponse.reply({
            content: '<:check:1137387353846063184> Informations ajoutées',
            ephemeral: true
        })

        event.description = modalResponse.fields.components[0].components[0].value
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