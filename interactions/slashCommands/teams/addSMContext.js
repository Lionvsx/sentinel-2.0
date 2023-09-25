const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const {SlashCommandBuilder} = require("@discordjs/builders");
const Teams = require("../../../src/schemas/TeamSchema");

module.exports = class AddSMContext extends BaseInteraction {
    constructor() {
        super('add-manager-context', 'teams', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('add-manager-context')
                .setDescription('Ajoute des nouvelles instructions pour le smart manager')
                .addStringOption(option =>
                    option.setName('prompt')
                        .setDescription('Contexte')
                        .setRequired(true)
                )
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

        if (Team.customPrompt) interaction.channel.send({
            content: `<:alerttriangleyellow:1137390607069888593> Votre ancien contexte sera effacé :\n\`${Team.customPrompt}\``,
            ephemeral: true
        })

        Team.customPrompt = interaction.options.getString('prompt')

        await Team.save()

        interaction.reply({
            content: '<:check:1137387353846063184> Contexte ajouté :\n`' + Team.customPrompt + '`',
            ephemeral: true
        })
    }
}