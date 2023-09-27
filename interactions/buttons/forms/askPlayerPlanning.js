const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require('../../../src/schemas/TeamSchema');
const {getCurrentWeekNumber} = require("../../../utils/functions/systemFunctions");

module.exports = class AskPlayerPlanning extends BaseInteraction {
    constructor() {
        super('askPlayerPlanning', 'forms', 'select-menu', {
            userPermissions: [],
            clientPermissions: [],
        });
    }


    async run(client, interaction, buttonArgs) {
        const Team = await Teams.findOne({ linkedCategoryId: buttonArgs[2] });
        const day = buttonArgs[1];

        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });
        if (!Team.smartManager) return interaction.reply({
            content: '<:x_:1137419292946727042> Le smart manager n\'est pas activé pour cette équipe',
            ephemeral: true
        })
        interaction.deferUpdate()

        const hoursSelected = interaction.values; // Assuming 'values' contains the selected hours
        const userId = interaction.user.id;

        // Remove all availabilities of this user for the specified day
        Team.availabilities = Team.availabilities.filter(a => !(a.day === day && a.discordId === userId));

        let weekNumber = getCurrentWeekNumber()

        // Add new availabilities
        hoursSelected.forEach(hour => {
            Team.availabilities.push({
                discordId: userId,
                day: day,
                hour: hour,
                weekNumber: weekNumber,
                availability: "available"
            });
        });

        // Save the updated team document
        await Team.save();
    }
}