const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const {cancelEvent} = require("../../../../utils/functions/teamsFunctions");
const {MessageEmbed} = require("discord.js");
module.exports = class CancelEvent extends BaseInteraction {
    constructor() {
        super('cancelEvent', 'smartManager', 'button', {
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

        await cancelEvent(interaction.guild, Team, event.id)

        await interaction.update({
            embeds: [
                new MessageEmbed()
                    .setColor('#2b2d31')
                    .setTitle('<:lock:1137390640418803782> ` DECISION ` Annulation de l\'évènement')
                    .setDescription(`L'évènement a été annulé par ${interaction.user.displayName}`)
            ],
            components: []
        })
    }
}