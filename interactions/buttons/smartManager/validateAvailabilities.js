const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");


module.exports = class ValidateAvailabilities extends BaseInteraction {
    constructor() {
        super('validateAvailabilities', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let Team = await Teams.findOne({linkedCategoryId: buttonArgs[1]})
        if (!Team.smartManager) return interaction.reply({
            content: '<:x_:1137419292946727042> Le smart manager n\'est pas activé pour cette équipe',
        })

        if (!Team.availabilitiesAnswered) Team.availabilitiesAnswered = 0

        Team.availabilitiesAnswered++
        Team.playersAnswered.push(interaction.user.id)
        await Team.save()

        // Make the button disabled
        interaction.message.components[2].components[0].setDisabled(true).setLabel("Disponibilités confirmées, vous pouvez toujours les modifier si nécessaire")
        await interaction.update({components: interaction.message.components})

        if (Team.availabilitiesAnswered >= Team.minPlayers) {
            console.log("works")
        }
    }
}