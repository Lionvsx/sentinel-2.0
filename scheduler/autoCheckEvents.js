const cron = require('node-cron');
const Teams = require("../src/schemas/TeamSchema");
const {updatePastEventEmbed, cancelEvent, alertTeamMembers} = require("../utils/functions/teamsFunctions");
const {MessageEmbed} = require("discord.js");
const {createEmojiButton, createMessageActionRow} = require("../utils/functions/messageComponents");

let tasks = {};  // Un objet pour stocker les tâches planifiées selon l'ID de la guilde.

module.exports = {
    scheduleEventTask: (guild) => {
        if (tasks[guild.id]) {
            tasks[guild.id].stop();
        }
        // Every 5 minutes
        tasks[guild.id] = cron.schedule('*/5 * * * *', async () => {
            console.log("Running event scheduled task")
            const AllTeams = await Teams.find();
            if (!AllTeams) return

            for (const Team of AllTeams) {
                // Check if team has smart manager enabled
                if (!Team.smartManager) continue;

                if (Team.events.length < 1) continue;

                let parentChannel = guild.channels.cache.get(Team.linkedCategoryId);
                let organisationChannel = parentChannel.children.find(channel => channel.name.includes('organisation'));
                let staffChannel = parentChannel.children.find(channel => channel.name.includes('staff'))

                let Events = Team.events.filter(event => !event.archived);

                if (Events.length < 1) continue;


                for (const Event of Events) {
                    let addScoreButton = createEmojiButton(`addScore|${Event._id}`, 'Add score', 'SECONDARY', '<:editpen:1137390632445431950>')
                    let addTournamentResultButton = createEmojiButton(`addTournamentResult|${Event._id}`, 'Add result', 'SECONDARY', '<:editpen:1137390632445431950>')

                    let currentTime = Math.floor(Date.now() / 1000);
                    let participants = Event.rsvps.filter(rsvp => rsvp.attending === "yes")
                    let participantsDiscordIds = participants.map(rsvp => rsvp.userId)

                    if (Event.discordTimestamp + Event.duration * 60 < currentTime) {
                        let newEmbed = updatePastEventEmbed(Event);
                        let message = await organisationChannel.messages.fetch(Event.messageId);
                        Event.archived = true;
                        if (Event.type !== "team-building" && Event.type !== "review" && Event.type !== "tournament") {
                            message.edit({
                                embeds: [newEmbed],
                                components: [
                                    createMessageActionRow([addScoreButton])
                                ]
                            });
                        } else if (Event.type === "tournament") {
                            message.edit({
                                embeds: [newEmbed],
                                components: [
                                    createMessageActionRow([addTournamentResultButton])
                                ]
                            });
                        } else {
                            message.edit({
                                embeds: [newEmbed]
                            });
                        }
                        continue;
                    }

                    // If event starts in less than 30 min, send a reminder
                    if (Event.discordTimestamp - 1800 <= currentTime && currentTime <= Event.discordTimestamp - 1500) {
                        for (const participant of participantsDiscordIds) {
                            let dmChannel = await guild.members.cache.get(participant).createDM();
                            dmChannel.send({
                                embeds: [new MessageEmbed().setDescription(`<:bell:1153604390356271124> L'événement ${Event.name} va commencer dans <t:${Event.discordTimestamp}:R>`).setColor("#2b2d31")]
                            })
                        }
                    }
                    if (Event.discordTimestamp - 3600 <= currentTime) { // Check if event starts in less than 1 hours
                        if (participants.length < Event.slots) { // Check if event is full
                            let missingPlayers = Event.slots - participants.length;
                            if (missingPlayers > Event.slots / 2) {
                                await cancelEvent(guild, Team, Event.id)
                                await staffChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setDescription(`<:alerttriangleyellow:1137390607069888593> L'événement ${Event.name} n'est pas complet. J'ai annulé l'événement car il restait moins d'une heure avant le début.`)
                                            .setColor("#2b2d31")
                                    ]
                                })
                            }
                        }
                    }
                    if (currentTime - 2.5*60 <= Event.discordTimestamp - 21600 && Event.discordTimestamp - 21600 <= currentTime + 2.5*60) {
                        if (participants.length < Event.slots) {
                            let missingPlayers = Event.slots - participants.length;
                            if (missingPlayers > Event.slots) {
                                await alertTeamMembers(guild, Team, Event)
                                await staffChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setDescription(`<:alerttriangleyellow:1137390607069888593> L'événement ${Event.name} n'est pas complet. J'ai envoyé une notification à tous les membres de l'équipe pour qu'ils répondent.`)
                                            .setColor("#2b2d31")
                                    ]
                                })
                            }
                        }
                    }
                }
                await Team.save();
            }
        })
    }
}