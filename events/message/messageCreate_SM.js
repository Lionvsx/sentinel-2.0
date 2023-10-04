const BaseEvent = require('../../utils/structures/BaseEvent');
const Teams = require('../../src/schemas/TeamSchema');
const {getParisUTCOffset, getParisISOString, getParisCurrentDay} = require("../../utils/functions/systemFunctions");
const OpenAIInterface = require("../../ai/OpenAIInterface");
const {createEvents} = require("../../utils/functions/teamsFunctions");

module.exports = class MessageCreateSmartManagerEvent extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (!message.mentions.has(client.user.id)) return;

        if (message.channel.name !== '📌┃organisation') return;
        let parentChannelID = message.channel.parent.id;
        let Team = await Teams.findOne({linkedCategoryId: parentChannelID});

        if (!Team || !Team.smartManager) return;

        await message.react(client.loadingEmoji)

        const Interface = new OpenAIInterface(client, "You are an AI Agent designed to transform the announcement message into a smart message using the provided function. Only use the function when there is an event in the user message." +
            "Current time and date is " + getParisISOString() + " and we are " + getParisCurrentDay() +
            "The duration for 1 game is " + Team.trainingTime + " minutes." +
            "The minimum number of players for a " + Team.trainTags.join(' or ') + " is " + Team.minPlayers + " players.")

        let trainTags = Team.trainTags.concat(["team-building", "review", "tournament"]);

        let parisOffset = getParisUTCOffset();

        let response = await Interface.callGPT('gpt-4', [
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
        ], message.content)

        message.channel.parent.children.find(channel => channel.name.includes('organisation'))

        if (response.finish_reason !== "function_call") {
            await message.reply({
                content: `<:x_:1137419292946727042> Erreur : ${response.message.content}`
            })
            await message.delete()
            return;
        }

        let responseData = JSON.parse(response.message.function_call.arguments)
        console.log(responseData)
        await createEvents(message.guild, Team, responseData)

        message.delete()
    }
}