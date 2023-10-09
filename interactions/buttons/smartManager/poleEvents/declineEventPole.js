const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Events = require("../../../../src/schemas/EventSchema");
const {updateEventEmbed} = require("../../../../utils/functions/poleFunctions");

module.exports = class DeclineEventPole extends BaseInteraction {
    constructor() {
        super('declineEventPole', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let event = await Events.findOne({id: buttonArgs[1]})
        if (!event) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        // Vérification : Le joueur a-t-il déjà refusé ?
        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id && rsvp.attending === "no")) {
            return interaction.reply({
                content: "<:x_:1137419292946727042> Vous avez déjà refusé de participer à cet événement.",
                ephemeral: true
            });
        }

        // Vérification : Le joueur était-il inscrit à l'événement pour commencer ?
        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id)) {
            let rsvpToUpdate = event.rsvps.find(rsvp => rsvp.userId === interaction.user.id);
            rsvpToUpdate.attending = "no";
        } else {
            event.rsvps.push({
                userId: interaction.user.id,
                attending: "no"
            });
        }

        await event.save();

        let eventEmbed = updateEventEmbed(event)

        interaction.update({
            embeds: [eventEmbed],
        })
    }
}
