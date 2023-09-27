const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {updateEventEmbed} = require("../../../utils/functions/teamsFunctions");

module.exports = class MaybeEvent extends BaseInteraction {
    constructor() {
        super('maybeEvent', 'smartManager', 'button', {
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

        let event = Team.events.find(event => String(event._id) === buttonArgs[1])
        if (!event) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        // Vérification : Le joueur participe-t-il déjà ?
        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id && rsvp.attending === "maybe")) {
            return interaction.reply({
                content: "<:info:1137425479914242178> Vous avez déjà répondu à cet événement.",
                ephemeral: true
            });
        }

        // Vérification : Le joueur était-il inscrit à l'événement pour commencer ?
        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id)) {
            let rsvpToUpdate = event.rsvps.find(rsvp => rsvp.userId === interaction.user.id);
            rsvpToUpdate.attending = "maybe";
        } else {
            event.rsvps.push({
                userId: interaction.user.id,
                attending: "maybe"
            });
        }

        await Team.save();

        let eventEmbed = updateEventEmbed(event)

        interaction.update({
            embeds: [eventEmbed],
        })
    }
}
