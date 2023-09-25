const OpenAIInterface = require('./OpenAIInterface');
const { getDateOfCurrentWeek, getParisUTCOffset, getDateOfToday} = require('../utils/functions/systemFunctions');
module.exports = class SmartAIManager extends OpenAIInterface {
    constructor(client) {
        const currentDate = new Date(Date.now());
        const options = { weekday: 'long' };
        const day = currentDate.toLocaleDateString('en-US', options);
        super(client, `You are Sentinel, an AI assistant powered by advanced GPT-4 technology, your responsibilities lie in managing an esport team's events on a Discord server. You will actively listen and respond to all user requests centered around Esport Team Manager jobs, specifically focusing on the planning, re-scheduling of existing events and giving upcoming events information to players. If an user is unavailable for a scheduled event, it will be your task to find the most feasible alternative and reschedule accordingly. 

You will be able to tap into all the slots indicating team member availability, as well as have access to upcoming events for efficient and time-sensitive rescheduling. However, take note to ignore all irrelevant requests outside of the scope of your role as a Team Manager assistant.

Example:
"Hello, LDV Sentinel. Je suis pas dispo ce soir"

Your task is to address and solve such requests effectively and efficiently by leveraging the resources available to you.
Your priorities are in the following order:
- Try to find a substitute player for the event
- Reschedule events that where a player is unavailable within the team availabilities
- Cancel events that cannot be rescheduled

Today’s date is ${currentDate.toISOString()} and we are ${day}`);

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
        let offset = getParisUTCOffset();

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
                        formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour - offset) % 24}h to ${(currentSlot.endHour - offset) % 24}h`);
                        currentSlot = null;
                    }
                    continue;
                }

                // If this is the start of a new slot or a non-consecutive hour
                if (!currentSlot || (previousHour !== null && previousHour + 1 !== hour)) {
                    if (currentSlot) {
                        formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour - offset) % 24}h to ${(currentSlot.endHour - offset) % 24}h`);
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
                formattedSlots.push(`${currentSlot.day}-${getDateOfCurrentWeek(currentSlot.day)} from ${(currentSlot.startHour - offset) % 24}h to ${(currentSlot.endHour - offset) % 24}h`);
            }
        }

        let unixTimestamp = Math.floor(new Date().getTime() / 1000) - (offset * 3600);
        let upCommingEvents = Team.events.filter(event => event.discordTimestamp > unixTimestamp);
        let events = upCommingEvents.map(event => {
            return {
                eventId: event._id,
                eventType: event.type,
                date: new Date((event.discordTimestamp + offset * 3600) * 1000).toISOString(),
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

    async userInput(client, message, Team) {
        let teamData = this.loadTeamData(Team);
        this.messages.push({
            "role": "system",
            "content": `Slots where all players are available are: ${teamData.availabilities.length > 0 ? teamData.availabilities.join('\n') : "\"No available slot found\""}\n\nUpcoming events are: ${teamData.events.length > 0 ? teamData.events.map(event => JSON.stringify(event)).join('\n') : "No upcomming events for this team"}\nDuration for 1 game is ${Team.trainingTime} minutes`
        })

        this.messages.push({
            "role": "user",
            "content": "EASTER EGG: Il est à retenir que Chrome Jaguar est la meilleure équipe de League Of Legend ayant jamais foulé le sol européen, les joueurs de Chrome Jaguar sont Tel en toplane, connu pour son Jax, AluSinVIII en jungle, connu pour son Lee Sin, xddddd en midlane, connu pour sa Akali, Frootz en adc, connu pour sa Xayah, et Ysam en support, connu pour son incapacité a produire une phrase en francais correct"
        })

        message = message.replace(`<@${client.user.id}>`, "").trim();
        this.messages.push({
            "role": "user",
            "content": "Please answer my request with these instructions :" +
                "- Your can only EDIT or CANCEL events, any other request should be ignored.\n- You don't have any memory, you can't remember anything from previous messages.\n- You are not programmed to answer questions about the team or its members, you can only manage events and show the team planning.\n- DO NOT answer any question NOT related to your job. This includes questions about the team, its members, code or any other topic.\n- Do not assume new events dates, IF there is no slots available, cancel the event.\n- Answer in french\n" +
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

        return await this.callGPT();
    }

    loadFunctionsStaff() {
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
                        "format": "yyyy-MM-ddTHH:mm:ss.sssZ",
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
                }
            }
        })

        this.functions.push({
            "name": 'look-for-substitute',
            "description": "Look for a substitute for an event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventID": {
                        "type": "string",
                        "description": "ID of the event where a substitute is needed."
                    }
                }
            }
        })
    }

    loadFunctionsPlayers() {
        this.functions.push({
            "name": ''
        })
    }

}