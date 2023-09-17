const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {updateTeamsDashboard} = require("../../../utils/functions/teamsFunctions");


module.exports = class ButtonSMOn extends BaseInteraction {
    constructor() {
        super('buttonSMOn', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let Team = await Teams.findOne({linkedCategoryId: buttonArgs[1]})
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });
        Team.smartManager = true
        await Team.save()
        await interaction.deferUpdate()
        await updateTeamsDashboard(interaction.channel, true)
    }
}