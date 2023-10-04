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

        let availabilities = Team.availabilities.filter(av => av.availability === "available");

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

            let mergedHours = []; // This array will store the merged hours

            for (let [hour, hourAvail] of groupedByHour.entries()) {
                let usernames = hourAvail.map(av => interaction.guild.members.cache.get(av.discordId).user.username).sort().join(', ');

                if (mergedHours.length > 0 && mergedHours[mergedHours.length - 1].usernames === usernames &&
                    mergedHours[mergedHours.length - 1].endHour === hour - 1) {
                    mergedHours[mergedHours.length - 1].endHour = hour; // Extend the hour range
                } else {
                    mergedHours.push({
                        startHour: hour,
                        endHour: hour,
                        usernames: usernames,
                        hourAvail: hourAvail
                    }); // Add a new entry
                }
            }

            // Now process mergedHours for the final output
            mergedHours.forEach(hourGroup => {
                let availableCount = hourGroup.hourAvail.filter(a => a.availability === 'available').length;
                let missingPlayers = FULL_TEAM_COUNT - availableCount < 0 ? 0 : FULL_TEAM_COUNT - availableCount;

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

                // Modification ici : ajustement de l'heure de fin pour qu'elle corresponde à l'heure de fin du créneau
                let adjustedEndHour = hourGroup.endHour + 1;
                let hourRange = hourGroup.startHour === hourGroup.endHour ?
                    `${hourGroup.startHour}h - ${adjustedEndHour}h` :
                    `${hourGroup.startHour}h - ${adjustedEndHour}h`;
                dayDescription += `${emoji} ${hourRange} (${hourGroup.usernames})\n`;
            });


            embed.addFields({
                name: day,
                value: dayDescription,
                inline: true
            });
        }

        interaction.reply({ embeds: [embed], ephemeral: true});
    }
}
