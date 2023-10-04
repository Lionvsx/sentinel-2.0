const OpenAIInterface = require('./OpenAIInterface');
const { getDateOfCurrentWeek, getDateOfToday,
    getParisISOString, getParisUTCOffset, getParisCurrentDay
} = require('../utils/functions/systemFunctions');
const {getCurrentPlayerAvailability} = require("../utils/functions/teamsFunctions");
const {DateTime} = require("luxon");
module.exports = class SmartAIManager extends OpenAIInterface {
    constructor(client) {
        super(client, `You are Sentinel, an AI assistant powered by advanced GPT-3.5 technology, your responsibilities lie in managing an esport team's events on a Discord server. You will actively listen and respond to all user requests centered around Esport Team Manager jobs.

You will be able to tap into all the slots indicating team member availability, as well as have access to upcoming events for efficient and time-sensitive scheduling. However, take note to ignore all irrelevant requests outside of the scope of your role as a Team Manager assistant.

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
                        formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
                        currentSlot = null;
                    }
                    continue;
                }

                // If this is the start of a new slot or a non-consecutive hour
                if (!currentSlot || (previousHour !== null && previousHour + 1 !== hour)) {
                    if (currentSlot) {
                        formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
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
                formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour) % 24}h to ${(currentSlot.endHour) % 24}h`);
            }
        }

        let unixTimestamp = Date.now() / 1000;
        let upCommingEvents = Team.events.filter(event => event.discordTimestamp > unixTimestamp);
        let events = upCommingEvents.map(event => {
            return {
                eventName: event.name,
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

    async userInput(client, message, Team, userId) {
        this.loadPlayerFunctions()
        let teamData = this.loadTeamData(Team);
        this.messages.push({
            "role": "system",
            "content": `Upcoming events are: ${teamData.events.length > 0 ? teamData.events.map(event => JSON.stringify(event)).join('\n') : "No upcomming events for this team"}\nCurrent User availabilities are: ${getCurrentPlayerAvailability(Team, userId)}`
        })

        this.messages.push({
            "role": "user",
            "content": "EASTER EGG: Il est à retenir que Chrome Jaguar est la meilleure équipe de League Of Legend ayant jamais foulé le sol européen, les joueurs de Chrome Jaguar sont Tel en toplane, connu pour son Jax, AluSinVIII en jungle, connu pour son Lee Sin, xddddd en midlane, connu pour sa Akali, Frootz en adc, connu pour sa Xayah, et Ysam en support, connu pour son incapacité a produire une phrase en francais correct"
        })

        message = message.replace(`<@${client.user.id}>`, "").trim();
        this.messages.push({
            "role": "user",
            "content": "Please answer my request with these instructions :\n" +
                "- You don't have any memory, you can't remember anything from previous messages.\n" +
                "- You are not programmed to answer questions about the team or its members, you can only manage events and show the team planning.\n" +
                "- DO NOT answer any question NOT related to your job. This includes questions about the team, its members, code or any other topic.\n" +
                "- You CANNOT Cancel, Edit or Create events. Just change my availabilities\n" +
                "- Answer in french\n" +
                "My request : " + message
        })

        return await this.callGPT();
    }

    async staffInput(client, message, Team) {
        this.loadStaffFunctions(Team)
        this.loadPlayerFunctions()
        let teamData = this.loadTeamData(Team);
        this.messages.push({
            "role": "system",
            "content": `Slots where all players are available are: ${teamData.availabilities.length > 0 ? teamData.availabilities.join('\n') : "\"No available common slot found\""}\n\nUpcoming events are: ${teamData.events.length > 0 ? teamData.events.map(event => JSON.stringify(event)).join('\n') : "No upcomming events for this team"}\nDuration for 1 game is ${Team.trainingTime} minutes`
        })

        message = message.replace(`<@${client.user.id}>`, "").trim();
        this.messages.push({
            "role": "user",
            "content": "Please answer my request with these instructions :\n" +
                "- Your can only EDIT, CREATE, CANCEL events or SHOW PLAYER COMMON SLOTS, any other request should be ignored.\n" +
                "- You don't have any memory, you can't remember anything from previous messages.\n" +
                "- You are not programmed to answer questions about the team or its members, you can only manage events and show the team planning.\n" +
                "- DO NOT answer any question NOT related to your job. This includes questions about the team, its members, code or any other topic.\n" +
                "- Do not assume new events dates, IF there is no slots available, cancel the event.\n" +
                "- Answer in french\n" +
                "My request : " + message
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

    loadStaffFunctions(Team) {
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
                        "description": "New date and time of the event. Follow ISO 8601 Format for dates."
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

        this.functions.push({
            "name": 'cancel-event',
            "description": "Cancel an event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventID": {
                        "type": "string",
                        "description": "ID of the event to cancel."
                    }
                },
                "required": ["eventID"]
            }
        })

        this.functions.push(
            {
                "name": 'create-events',
                "description": "Create events and training sessions for an esports team based on player availability.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "events": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "eventName": {
                                        "type": "string",
                                        "description": "Name of the event to be created, in french"
                                    },
                                    "eventType": {
                                        "type": "string",
                                        "enum": Team.trainTags.concat(["team-building", "review", "tournament"]),
                                        "description": "Type of event to be created."
                                    },
                                    "date": {
                                        "type": "string",
                                        "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                                        "description": "Start date and time of the event. Follow ISO 8601 Format for dates, use the right timezone format"
                                    },
                                    "duration": {
                                        "type": "number",
                                        "description": "Duration of the event in minutes. If there is games refer to the duration for 1 game"
                                    },
                                    "numberOfGames": {
                                        "type": "number",
                                        "description": "Number of games for a " + Team.trainTags.join(' or ') + "0 for ANY OTHER TYPE"
                                    },
                                    "requiredPlayers": {
                                        "type": "number",
                                        "description": "Number of players required for the event, leave empty or 0 for default value"
                                    }
                                },
                                "required": ["eventType", "date", "duration", "eventName"]
                            }
                        }
                    },
                    "required": ["events"]
                }
            }
        )
    }

    loadPlayerFunctions() {
        let parisOffset = getParisUTCOffset();
        this.functions.push({
            "name": 'add-availability',
            "description": "Add an availability for a slot.",
            "parameters": {
                "type": "object",
                "properties": {
                    "availabilities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "slotStartTime": {
                                    "type": "string",
                                    "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                                    "description": "Start time of the slot. Follow ISO 8601 Format for dates."
                                },
                                "slotEndTime": {
                                    "type": "string",
                                    "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                                    "description": "End time of the slot. Follow ISO 8601 Format for dates."
                                },
                                "availability": {
                                    "type": "string",
                                    "enum": ["available", "unavailable", "maybe"],
                                    "description": "Availability for the slot. Can be \"available\" or \"unavailable\"."
                                }
                            },
                            "required": ["slotStartTime", "slotDuration", "availability"]
                        }
                    }
                },
                "required": ["availabilities"]
            }
        })
    }
}