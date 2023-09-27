const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const {alertEvent} = require("../../../../utils/functions/teamsFunctions");
module.exports = class AlertEvent extends BaseInteraction {
    constructor() {
        super('alertEvent', 'smartManager', 'button', {
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

        await alertEvent(interaction.guild, event)

        if (interaction.message.components[1]) {
            interaction.message.components.splice(1, 1)
        }

        interaction.reply({
            content: '<:check:1137387353846063184> J\'ai envoyé une notification à tous les participants',
            ephemeral: true
        })

        await interaction.message.edit({
            components: interaction.message.components
        })
    }
}