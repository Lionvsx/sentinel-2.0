const { MessageEmbed } = require('discord.js');
const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {getDateOfCurrentWeek} = require("../../../utils/functions/systemFunctions");

module.exports = class ViewTeamPlanning extends BaseInteraction {
    constructor() {
        super('viewTeamPlanning', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let Team = await Teams.findOne({ linkedCategoryId: buttonArgs[1] });
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        let availabilities = Team.availabilities;

        // Sort by day
        function customSortDays(a, b) {
            return getDateOfCurrentWeek(a.day) - getDateOfCurrentWeek(b.day);
        }

        availabilities.sort(customSortDays);

        // Regrouper par jour
        const groupedByDay = new Map();
        availabilities.forEach(av => {
            if (!groupedByDay.get(av.day)) {
                groupedByDay.set(av.day, []);
            }
            groupedByDay.get(av.day).push(av);
        });

        const embed = new MessageEmbed()
            .setTitle(`<:calendar:1137424147056689293> Planning de l'équipe`)
            .setColor('#3498db');





        for (let [day, avail] of groupedByDay.entries()) {
            function customSortHours(a, b) {
                if (a.hour >= 0 && a.hour < 6) {
                    return (b.hour >= 0 && b.hour < 6) ? a.hour - b.hour : 1;
                }
                if (b.hour >= 0 && b.hour < 6) {
                    return -1;
                }
                return a.hour - b.hour;
            }
            // Trier par heure pour chaque jour
            avail.sort(customSortHours);

            let dayDescription = '';

            const FULL_TEAM_COUNT = Team.minPlayers;

            // Group by hour to count available players per hour
            const groupedByHour = new Map();
            avail.forEach(av => {
                if (!groupedByHour.get(av.hour)) {
                    groupedByHour.set(av.hour, []);
                }
                groupedByHour.get(av.hour).push(av);
            });

            for (let [hour, hourAvail] of groupedByHour.entries()) {
                let availableCount = hourAvail.filter(a => a.availability === 'available').length;
                let missingPlayers = FULL_TEAM_COUNT - availableCount;

                let emoji;
                switch (missingPlayers) {
                    case 0:
                        emoji = '<:checksquare:1137390612543459398>';
                        break;
                    case 1:
                        emoji = '<:users:1137390672194850887>';
                        break;
                    default:
                        emoji = '<:userx:1137394869812351006>';
                        break;
                }

                let usernames = hourAvail.map(av => interaction.guild.members.cache.get(av.discordId).user.username).join(', ');
                dayDescription += `${emoji} ${hour}h (${usernames})\n`;
            }

            embed.addFields({
                name: day,
                value: dayDescription,
                inline: true
            });
        }

        interaction.reply({ embeds: [embed], ephemeral: true});
    }
}
