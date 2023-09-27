const BaseEvent = require('../../utils/structures/BaseEvent');
const Teams = require('../../src/schemas/TeamSchema');
const {minutesToHHMM, getParisUTCOffset} = require("../../utils/functions/systemFunctions");
const OpenAIInterface = require("../../ai/OpenAIInterface");
const {MessageEmbed} = require("discord.js");
const {
    createEmojiButton,
    createMessageActionRow
} = require("../../utils/functions/messageComponents");
const {Types} = require("mongoose");

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

        // Add UTC Offset to date
        let offset = getParisUTCOffset() // offset in hours between UTC and paris
        const currentDate = new Date(Date.now() + (offset * 3600 * 1000));
        const options = { weekday: 'long' };
        const day = currentDate.toLocaleDateString('en-US', options);

        await message.react(client.loadingEmoji)

        const Interface = new OpenAIInterface(client, "You are an AI Agent designed to transform the announcement message into a smart message using the provided function. Only use the function when there is an event in the user message." +
            "Current time and date is " + currentDate.toISOString() + " and we are " + day +
            "The duration for 1 game is " + Team.trainingTime + " minutes.")

        let trainTags = Team.trainTags.concat(["team-building", "review", "tournament"]);

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
                                    "eventType": {
                                        "type": "string",
                                        "enum": trainTags,
                                        "description": "Type of event to be created."
                                    },
                                    "date": {
                                        "type": "string",
                                        "format": "yyyy-MM-ddTHH:mm:ss.sssZ",
                                        "description": "Start date and time of the event. Follow ISO 8601 Format for dates."
                                    },
                                    "duration": {
                                        "type": "number",
                                        "description": "Duration of the event in minutes. If there is games refer to the duration for 1 game"
                                    },
                                    "numberOfGames": {
                                        "type": "number",
                                        "description": "Number of games for a " + Team.trainTags.join(' or ') + "0 for ANY OTHER TYPE"
                                    }
                                },
                                "required": ["eventType", "date", "duration"]
                            }
                        }
                    },
                    "required": ["events"]
                }
            }
        ], message.content)

        let organisationChannel = message.channel.parent.children.find(channel => channel.name.includes('organisation'))

        if (response.finish_reason !== "function_call") {
            message.reply({
                content: `<:x_:1137419292946727042> Erreur : ${response.message.content}`,
                ephemeral: true
            })
            await message.delete()
            return;
        }

        let responseData = JSON.parse(response.message.function_call.arguments)
        for (const event of responseData.events) {

            // Switch emoji on event type :
            let title = ''
            switch (event.eventType) {
                case 'training':
                    title = '<:zap:1137424324144410736> ` TRAINING `'
                    break
                case 'pracc':
                    title = '<:crosshair:1137436482248904846> ` PRACC `'
                    break
                case 'tournament':
                    title = '<:flag:1153289152536772659> ` TOURNAMENT `'
                    break
                case 'scrim':
                    title = '<:zap2:1137424322399571988> ` SCRIM `'
                    break
                case 'team-building':
                    title = '<:users:1137390672194850887> ` TEAM BUILDING `'
                    break
                case 'review':
                    title = '<:search:1153289155405680721> ` REVIEW `'
                    break
                default:
                    title = '<:calendar:1137424147056689293> ` EVENT `'
                    break
            }
            const unixTimestamp = Math.floor(new Date(event.date).getTime() / 1000 - (offset * 3600));

            let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${unixTimestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(event.duration)}\n`

            if (event.eventType !== 'review' && event.eventType !== 'team-building') {
                embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.numberOfGames}\n`
            }
            embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` 0/${Team.minPlayers}`


            let eventEmbed = new MessageEmbed()
                .setTitle(title)
                .setColor('#2b2d31')
                .setDescription(embedDescription)

            const myId = Types.ObjectId();


            let buttonAccept = createEmojiButton(`acceptEvent|${myId}`, '', 'SECONDARY', '<:usercheck:1137390666490589274>')
            let buttonMaybe = createEmojiButton(`maybeEvent|${myId}`, '', 'SECONDARY', '<:userplus3:1153405260812005547>')
            let buttonDecline = createEmojiButton(`declineEvent|${myId}`, '', 'SECONDARY', '<:userx:1137394869812351006>')
            let buttonSettings = createEmojiButton(`eventSettings|${myId}`, '', 'SECONDARY', '<:settings2:1153405967409623141>')


            eventEmbed.addFields([
                {
                    name: '<:check:1137390614296678421> ` CONFIRMES `',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: '<:users:1137390672194850887> ` PEUT-ÊTRE `',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: '<:x_:1137419292946727042> ` INDISPONIBLES `',
                    value: '\u200b',
                    inline: true
                }
            ])
            let eventMessage = await organisationChannel.send({
                content: "<@&" + Team.linkedRoleId + ">",
                embeds: [eventEmbed],
                components: [
                    createMessageActionRow([buttonAccept, buttonMaybe, buttonDecline, buttonSettings])
                ]
            })


            Team.events.push({
                _id: myId,
                name: title,
                type: event.eventType,
                attendance: true,
                discordTimestamp: unixTimestamp,
                duration: event.duration,
                nbGames: event.numberOfGames,
                slots: Team.minPlayers,
                messageId: eventMessage.id
            })
            await Team.save()
        }

        message.delete()
    }
}