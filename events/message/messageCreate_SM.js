const BaseEvent = require('../../utils/structures/BaseEvent');
const Teams = require('../../src/schemas/TeamSchema');
const {MessageEmbed} = require("discord.js");
const {getDateTime} = require("../../utils/functions/systemFunctions");

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
        let Team = Teams.findOne({linkedCategoryId: parentChannelID});

        if (!Team || !Team.smartManager) return;

        let response = await client.openAIAgent.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an AI Agent designed to transform the announcement message into a smart message using the provided function. Only use the function when there is an event in the user message\n Current time and date is " + getDateTime()},
            ],
            temperature: 0,
            functions: [
                {
                    name: "create-event",
                    description: "Create an event for an esport team",
                    parameters: {
                        type: "object",
                        properties: {
                            eventType: {
                                type: "string",
                                enum: ["training", "scrim", "tournament", "info", "pracc"]
                            },
                            eventName: {
                                type: "string",
                            },
                            eventDate: {
                                type: "string",
                                description: "Date of the event in the format: 2021-09-30T18:30:00.000Z"
                            },
                            eventDescription: {
                                type: "string",
                            },
                            eventLink: {
                                type: "string",
                                description: "Useful link for the event, or tracker if it's a pracc / scrim"
                            },
                            needRSVP: {
                                type: "boolean",
                                description: "Whether or not the event needs an RSVP from the team members"
                            },
                            embed: {
                                type: "object",
                                properties: {
                                    "title": {
                                        "type": "string",
                                        "description": "The title of the embed, should be in this format : emoji ` Event name `"
                                    },
                                    "description": {
                                        "type": "string",
                                        "description": "The description of the embed"
                                    }
                                },
                                required: ["title", "description"]
                            }
                        },
                        required: ["eventType", "eventName", "eventDate", "eventDescription", "needRSVP", "embed"]
                    }
                }
            ],
            function_call: "auto",
        })

        if (response.data.choices[0].function_call) {
            let params = JSON.parse(response.data.choices[0].function_call.arguments)

            let eventEmbed = new MessageEmbed()
                .setTitle(params.embed.title)
                .setDescription(params.embed.description)
                .setColor('#2b2d31')
                .setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
        }
    }
}