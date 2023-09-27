const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {updateEventEmbed} = require("../../../utils/functions/teamsFunctions");
module.exports = class AcceptEvent extends BaseInteraction {
    constructor() {
        super('acceptEvent', 'smartManager', 'button', {
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
        // Vérification : L'utilisateur a-t-il déjà répondu ?
        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id && rsvp.attending === "yes")) {
            return interaction.reply({
                content: "<:info:1137425479914242178> Vous participez déjà à cet événement.",
                ephemeral: true
            });
        }

        // Vérification : Le nombre maximal de joueurs est-il atteint ?
        let playerYes = event.rsvps.filter(rsvp => rsvp.attending === "yes");
        if (playerYes.length >= event.slots) {
            return interaction.reply({
                content: "<:x_:1137419292946727042> Désolé, cet événement est déjà complet.",
                ephemeral: true
            });
        }

        if (event.rsvps.some(rsvp => rsvp.userId === interaction.user.id)) {
            let rsvpToUpdate = event.rsvps.find(rsvp => rsvp.userId === interaction.user.id);
            rsvpToUpdate.attending = "yes";
        } else {
            event.rsvps.push({
                userId: interaction.user.id,
                attending: "yes"
            });
        }

        await Team.save()

        let eventEmbed = updateEventEmbed(event)

        // Update the message
        interaction.update({
            embeds: [eventEmbed],
        })
    }
}