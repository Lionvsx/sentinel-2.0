const OpenAIInterface = require('./OpenAIInterface');
const { getDateOfCurrentWeek, getDateOfToday,
    getParisISOString, getParisCurrentDay, getParisUTCOffset
} = require('../utils/functions/systemFunctions');
const {DateTime} = require("luxon");
module.exports = class SmartAIRescheduler extends OpenAIInterface {
    constructor(client) {
        super(client, `You are Sentinel, an AI assistant powered by advanced GPT-3.5 technology, your responsibilities lie in managing an esport team's events on a Discord server. You will actively listen and respond to all user requests centered around Esport Team Manager jobs, specifically focusing on the re-scheduling of existing events. It will be your task to find the most feasible alternative and reschedule accordingly. 

You will be able to tap into all the slots indicating team member availability, as well as have access to upcoming events for efficient and time-sensitive rescheduling.
Your task is to address and solve such requests effectively and efficiently by leveraging the resources available to you.
Only use functions you have been provided with to perform actions. Anything outside your provided functions are outside of your scope.

Today’s is the ${getParisCurrentDay()} and the date is ${getParisISOString()}`);

        this.functions = [];
    }

    loadTeamData(Team) {
        if (!Team) {
            console.error('Erreur lors de la récupération de l\'équipe');
            return;
        }
        let availabilities = Team.availabilities;

        // Regrouper par jour
        const groupedByDay = {};
        availabilities.forEach(av => {
            if (!groupedByDay[av.day]) {
                groupedByDay[av.day] = [];
            }
            groupedByDay[av.day].push(av);
        });

        let formattedSlots = [];

        for (let [day, avail] of Object.entries(groupedByDay)) {

            if (getDateOfCurrentWeek(day) < getDateOfToday()) continue;

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

            const FULL_TEAM_COUNT = Team.minPlayers;

            // Group by hour to count available players per hour
            const groupedByHour = new Map();
            avail.forEach(av => {
                if (!groupedByHour.get(av.hour)) {
                    groupedByHour.set(av.hour, []);
                }
                groupedByHour.get(av.hour).push(av);
            });

            let currentSlot = null;
            let previousHour = null;

            for (let [hour, hourAvail] of groupedByHour.entries()) {
                let availableCount = hourAvail.filter(a => a.availability === 'available').length;

                // Skip if not enough players are available
                if (availableCount < FULL_TEAM_COUNT) {
                    if (currentSlot) {
                        formattedSlots.push(`${currentSlot.day} ${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
                        currentSlot = null;
                    }
                    continue;
                }

                // If this is the start of a new slot or a non-consecutive hour
                if (!currentSlot || (previousHour !== null && previousHour + 1 !== hour)) {
                    if (currentSlot) {
                        formattedSlots.push(`${currentSlot.day} ${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
                    }
                    currentSlot = {
                        day: day,
                        startHour: hour,
                        endHour: hour + 1
                    };
                } else {
                    currentSlot.endHour++;
                }

                previousHour = hour;
            }

            // Handle the final slot if any
            if (currentSlot) {
                formattedSlots.push(`${currentSlot.day} ${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
            }
        }

        let unixTimestamp = Date.now() / 1000;
        let upCommingEvents = Team.events.filter(event => event.discordTimestamp > unixTimestamp);
        let events = upCommingEvents.map(event => {
            return {
                eventId: event._id,
                eventType: event.type,
                date: DateTime.fromSeconds(event.discordTimestamp).setZone('Europe/Paris').toISO(),
                duration: event.duration + "minutes",
                numberOfGames: event.nbGames
            }
        })

        return {
            trainTags: Team.trainTags,
            minPlayers: Team.minPlayers,
            availabilities: formattedSlots,
            events: events
        };
    }

    callGPT() {
        return new Promise(async (resolve, reject) => {
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: this.messages,
                    functions: this.functions,
                    function_call: 'auto',
                    temperature: 0,
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }

    callGPTNoFunctions() {
        return new Promise(async (resolve, reject) => {
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: this.messages,
                    temperature: 0.7,
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }

    async rescheduleEvent(client, Team, eventID) {
        this.loadFunction()
        let teamData = this.loadTeamData(Team);
        this.messages.push({
            "role": "system",
            "content": `Slots where all players are available are: ${teamData.availabilities.length > 0 ? teamData.availabilities.join('\n') : "\"No available slot found\""}\n\nUpcoming events are: ${teamData.events.length > 0 ? teamData.events.map(event => JSON.stringify(event)).join('\n') : "No upcomming events for this team"}\nDuration for 1 game is ${Team.trainingTime} minutes`
        })

        this.messages.push({
            "role": "user",
            "content": "Please answer my request with these instructions :\n" +
                "- Answer in french\n" +
                "My request : Please reschedule the event with ID " + eventID + "to an available slot\nIf there is no available slot, just answer to the user that there is no available slot."
        })

        return await this.callGPT();
    }

    async functionInput(functionMessage, functionName) {
        this.messages.push({
            "role": "function",
            "name": functionName,
            "content": functionMessage
        })

        return await this.callGPTNoFunctions();
    }

    loadFunction() {
        let parisOffset = getParisUTCOffset();
        this.functions.push({
            "name": 'edit-event',
            "description": "Edit an event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventID": {
                        "type": "string",
                        "description": "ID of the event to edit."
                    },
                    "newDate": {
                        "type": "string",
                        "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                        "description": "New date and time of the event. Follow ISO 8601 Format for dates, use the right timezone format"
                    },
                    "newDuration": {
                        "type": "number",
                        "description": "New duration of the event in minutes."
                    },
                    "newNumberOfGames": {
                        "type": "number",
                        "description": "New number of games"
                    }
                },
                "required": ["eventID", "newDate", "newDuration", "newNumberOfGames"]
            }
        })
    }
}