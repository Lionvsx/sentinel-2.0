const cron = require('node-cron');
const Teams = require("../src/schemas/TeamSchema");
const {getNotionPageById} = require("../utils/functions/notionFunctions");
const {getTeamMembers} = require("../utils/functions/teamsFunctions");
const {createSelectionMenuOption, createSelectionMenu, createMessageActionRow,
    createEmojiButton
} = require("../utils/functions/messageComponents");
const {MessageEmbed} = require("discord.js");

let tasks = {};  // Un objet pour stocker les tâches planifiées selon l'ID de la guilde.

module.exports = {
    scheduleTeamTask: (guild) => {
        if (tasks[guild.id]) { // Si une tâche existe déjà pour cette guilde, on l'arrête.
            tasks[guild.id].stop();
        }
        tasks[guild.id] = cron.schedule('40 17 * * SUN', async () => {
            const AllTeams = await Teams.find();
            if (!AllTeams) return

            for (const Team of AllTeams) {
                if (!Team.smartManager) continue
                Team.availabilitiesAnswered = 0
                Team.playersAnswered = []
                Team.availabilities = [];
                Team.planningSent = false
                await Team.save()

                let notionTeam = await getNotionPageById(Team.linkedNotionPageId)

                let players = await getTeamMembers(notionTeam)

                let teamCategory = await guild.channels.fetch(Team.linkedCategoryId)
                let staffChannel = teamCategory.children.find(channel => channel.name.includes('staff'))

                const createHourlyAvailabilityOptions = (startHour, endHour, emoji) => {
                    let options = [];
                    for (let hour = startHour; hour < endHour; hour++) {
                        const label = `${hour}:00 - ${hour + 1}:00`;
                        options.push(createSelectionMenuOption(hour.toString(), label, undefined, emoji));
                    }
                    return options;
                };

                const dayOptions = createHourlyAvailabilityOptions(12, 18, '<:sun:1152170231050027038>');
                const eveningOptions = createHourlyAvailabilityOptions(18, 24, '<:sunset:1152170114456764426>');
                const nightOptions = createHourlyAvailabilityOptions(0, 6, '<:moon:1152170097356578877>');

                const mondayMenu = createSelectionMenu(`askPlayerPlanning|Monday|${Team.linkedCategoryId}`, 'Disponibilité pour Lundi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const tuesdayMenu = createSelectionMenu(`askPlayerPlanning|Tuesday|${Team.linkedCategoryId}`, 'Disponibilité pour Mardi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const wednesdayMenu = createSelectionMenu(`askPlayerPlanning|Wednesday|${Team.linkedCategoryId}`, 'Disponibilité pour Mercredi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const thursdayMenu = createSelectionMenu(`askPlayerPlanning|Thursday|${Team.linkedCategoryId}`, 'Disponibilité pour Jeudi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const fridayMenu = createSelectionMenu(`askPlayerPlanning|Friday|${Team.linkedCategoryId}`, 'Disponibilité pour Vendredi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const saturdayMenu = createSelectionMenu(`askPlayerPlanning|Saturday|${Team.linkedCategoryId}`, 'Disponibilité pour Samedi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
                const sundayMenu = createSelectionMenu(`askPlayerPlanning|Sunday|${Team.linkedCategoryId}`, 'Disponibilité pour Dimanche:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);


                for (const playerId of players) {
                    let playerDiscord = await guild.members.fetch(playerId)
                    try {
                        let playerDM = await playerDiscord.createDM()

                        await playerDM.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('<:arrowdown:1137420436016214058> Veuillez indiquer vos disponibilités pour la semaine (Lundi-Vendredi): <:arrowdown:1137420436016214058>')
                                    .setColor('#2b2d31')
                            ],
                            components: [
                                createMessageActionRow([mondayMenu]),
                                createMessageActionRow([tuesdayMenu]),
                                createMessageActionRow([wednesdayMenu]),
                                createMessageActionRow([thursdayMenu]),
                                createMessageActionRow([fridayMenu]),
                            ]
                        })

                        await playerDM.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('<:arrowdown:1137420436016214058> Veuillez indiquer vos disponibilités pour le week-end (Samedi-Dimanche): <:arrowdown:1137420436016214058>')
                                    .setColor('#2b2d31')
                            ],
                            components: [
                                createMessageActionRow([saturdayMenu]),
                                createMessageActionRow([sundayMenu])
                            ]
                        })

                        await playerDM.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription('<:arrowdown:1137420436016214058> Une fois vos disponibilités remplies, veuillez les confirmer <:arrowdown:1137420436016214058>')
                                    .setColor('#2b2d31')
                            ],
                            components: [
                                createMessageActionRow([
                                    createEmojiButton(`validateAvailabilities|${Team.linkedCategoryId}`, 'Je confirme mes disponibilités', 'SECONDARY', '<:check:1137390614296678421>')
                                ])
                            ]
                        })
                    } catch (e) {
                        staffChannel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setDescription(`<:x_:1137419292946727042> Impossible d'envoyer les formulaires de disponibilités à <@${playerId}>`)
                                    .setColor('#2b2d31')
                            ]
                        })
                    }
                }

                staffChannel.send({
                    embeds: [
                        new MessageEmbed().setDescription(`<:check:1137390614296678421> J'ai envoyé les formulaires de disponibilités pour la semaine à l'équipe \`${Team.name}\``).setColor('#2b2d31')
                    ]
                })
            }
        }, {
            timezone: "Europe/Paris"
        });
    },
    stopTask: (guild) => { // Fonction pour arrêter une tâche selon l'ID de la guilde.
        if (tasks[guild.id]) {
            tasks[guild.id].stop();
            delete tasks[guild.id];
        }
    }
}
