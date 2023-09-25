const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const {SlashCommandBuilder} = require("@discordjs/builders");
const Teams = require("../../../src/schemas/TeamSchema");

module.exports = class ClearSMContext extends BaseInteraction {
    constructor() {
        super('clear-manager-context', 'teams', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('clear-manager-context')
                .setDescription('Réinitialise le contexte du smart manager')
        })
    }

    async run(client, interaction) {
        let parentCategoryId = interaction.channel.parent.id
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous devez lancez cette commande dans un channel de team',
            ephemeral: true
        });

        if (!interaction.member.roles.cache.has('624715536693198888')) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous n\'avez pas la permission pour executer cette commande',
            ephemeral: true
        });


        Team.customPrompt = null
        await Team.save()

        interaction.reply({
            content: '<:check:1137387353846063184> Contexte réinitialisé avec succès.',
            ephemeral: true
        })
    }
}