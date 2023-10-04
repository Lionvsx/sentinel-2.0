const OpenAIInterface = require('./OpenAIInterface');
const { getDateOfCurrentWeek, getDateOfToday, getParisISOString,
    getParisCurrentDay, getParisUTCOffset
} = require('../utils/functions/systemFunctions');
module.exports = class SmartAIScheduler extends OpenAIInterface {
    constructor(client, Team) {
        super(client, `You are an intelligent planning agent, operating on an esport team calendar. You will be provided data by the user on the team availabilities and an average game duration.\nWith theses informations, your task is to create events suited for an esport team following these contraints:\n- Game reviews are often 30 or 45 minutes long for long games and cannot happen without prior training
- Do not create any event that starts after 21.30 in the evening
- You MUST create events within the players availabilities
- Be extra careful for the duration of a game and take pause time into consideration when creating events
- You MUST assist the user in the best way possible.

Today’s is the ${getParisCurrentDay()} and the date is ${getParisISOString()}`);

        let trainTags = Team.trainTags.concat(["team-building", "review"]);
        let parisOffset = getParisUTCOffset();
        this.openaiFunction = {
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
                                "RSVP": {
                                    "type": "boolean",
                                    "description": "Indicates if the event is mandatory or not."
                                },
                                "eventType": {
                                    "type": "string",
                                    "enum": trainTags,
                                    "description": "Type of event to be created."
                                },
                                "date": {
                                    "type": "string",
                                    "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                                    "description": "Start date and time of the event. Follow ISO 8601 Format for dates, use the right timezone format"
                                },
                                "duration": {
                                    "type": "number",
                                    "description": "Total duration of the event, in minutes, including all games and breaks."
                                },
                                "numberOfGames": {
                                    "type": "number",
                                    "description": "Number of games for a " + Team.trainTags.join(' or ') + "0 for ANY OTHER TYPE"
                                }
                            },
                            "required": ["RSVP", "eventType", "date", "duration"]
                        }
                    }
                },
                "required": ["events"]
            }
        };
    }

    async loadTeamData(Team) {
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

        console.log(formattedSlots)



        if (Team.customPrompt) {
            this.messages.push({
                "role": "user",
                "content": `Here are the time slots where all players are available: ${formattedSlots.join('\n')}.\n\nPlease create events for the following week with these constrains : 
            - Always prioritize scrims, training or praccs over team building or review events
            - Add team building and review events if the team have a lot of common time slots
            - Always group consecutive games in the same event
            - ${Team.trainTags.join(' or ')} events should not exceed 2 hours and 30 minutes.
            - 10 minutes between the games is the required time for the players to get ready for the next game
            - The average duration for 1 game is ${Team.trainingTime} minutes
            
            The following instructions should be followed very carefully :
                ${Team.customPrompt}`
            })
        } else {
            this.messages.push({
                "role": "user",
                "content": `Here are the time slots where all players are available: ${formattedSlots.join('\n')}.\n\nPlease create events for the following week with these constrains : 
            - Always prioritize scrims, training or praccs over team building or review events
            - Add team building and review events if the team have a lot of common time slots
            - Always group consecutive games in the same event
            - ${Team.trainTags.join(' or ')} events should not exceed 2 hours and 30 minutes.
            - 10 minutes between the games is the required time for the players to get ready for the next game
            - The average duration for 1 game is ${Team.trainingTime} minutes`
            })
        }

        return formattedSlots.length > 0;
    }

    callGPT() {
        return new Promise(async (resolve, reject) => {
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: 'gpt-4',
                    messages: this.messages,
                    functions: [this.openaiFunction],
                    function_call: { name: 'create-events' },
                    temperature: 0,
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }

}