const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const {updateEventEmbed} = require("../../../../utils/functions/teamsFunctions");
module.exports = class JoinEventSub extends BaseInteraction {
    constructor() {
        super('sub', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let Team = await Teams.findById(buttonArgs[2])
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        let event = Team.events.find(event => String(event._id) === buttonArgs[1])
        if (!event) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        if (event.archived) return interaction.reply({
            content: '<:x_:1137419292946727042> Cet événement est archivé',
            ephemeral: true
        });

        let ldvGuild = client.guilds.cache.get('227470914114158592')

        let parentCategory = ldvGuild.channels.cache.get(Team.linkedCategoryId)
        let organisationChannel = parentCategory.children.find(channel => channel.name.includes('organisation'))
        let eventMessage = await organisationChannel.messages.fetch(event.messageId)
        let guildMember = await ldvGuild.members.cache.get(interaction.user.id)

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
                content: "<:x_:1137419292946727042> Désolé, nous avons déjà trouvé un sub pour cet événement.",
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
        await guildMember.roles.add([Team.linkedRoleId, '1138459577734680577'])
        await Team.save()

        let eventEmbed = updateEventEmbed(event)

        // Update the message
        eventMessage.edit({
            embeds: [eventEmbed],
        })

        // Disable the button
        interaction.message.components[0].components[0].setDisabled(true)
        await interaction.message.edit({components: interaction.message.components})


        await interaction.reply({
            content: "<:check:1137419365042944001> Merci beaucoup d'avoir accepté de sub, vous avez été ajouté à l'évènement !",
        })
    }
}