const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const {MessageEmbed} = require("discord.js");
module.exports = class DeleteEvent extends BaseInteraction {
    constructor() {
        super('deleteEvent', 'smartManager', 'button', {
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

        // Send message to all event participants
        let eventParticipants = event.rsvps.map(rsvp => rsvp.userId)
        for (const participant of eventParticipants) {
            let user = await client.users.fetch(participant)
            let dmChannel = await user.createDM()
            dmChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<:trash:1137390663797841991> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été supprimé par un membre du staff`)
                        .setColor("#2b2d31")
                ]
            })
        }

        Team.events = Team.events.filter(event => String(event._id) !== buttonArgs[1])
        await Team.save()


        interaction.message.delete()
        await interaction.reply({
            content: '<:check:1137387353846063184> Événement supprimé',
            ephemeral: true
        })
    }
}