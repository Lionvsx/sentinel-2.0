const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const { Modal, TextInputComponent, showModal} = require('discord-modals');
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updatePastEventEmbed} = require("../../../../utils/functions/teamsFunctions");
module.exports = class AddTournamentResult extends BaseInteraction {
    constructor() {
        super('addTournamentResult', 'smartManager', 'button', {
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
            .setCustomId('addTournamentResultModal')
            .setTitle('Ajouter le résultat du tournoi')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('myTeamResult')
                    .setLabel('Quelle est le résultat de votre équipe ?')
                    .setPlaceholder('Placement')
                    .setStyle('SHORT')
                    .setRequired(true),
            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        });

        let modalResponse = await modalInteraction(interaction, modal.customId)

        event.result = modalResponse.fields.components[0].components[0].value
        await Team.save()

        let pastEventEmbed = updatePastEventEmbed(event)

        modalResponse.reply({
            content: `<:check:1137390614296678421> Résultat du tournoi ajouté`,
            ephemeral: true
        })

        // Update the message
        interaction.message.edit({
            embeds: [pastEventEmbed],
            components: []
        })
    }
}