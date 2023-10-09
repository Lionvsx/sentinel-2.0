const BaseEvent = require('../../utils/structures/BaseEvent');
const SmartAIPoles = require("../../ai/SmartAIPoles");
const Users = require("../../src/schemas/UserSchema");
const {cancelEvent, editEvent, createEvents} = require("../../utils/functions/poleFunctions");

const invertedPoleCategoryIds = new Map([
    ["741688834525364265", 'webtv'],
    ["741688796864839730", 'da'],
    ["741991177858842685", 'com'],
    ["742083412990361621", 'event'],
    ["741991157550022726", 'esport'],
    ["894735891329847396", 'partenariat'],
    ["741991095155556363", 'bureau']
]);

module.exports = class MessageCreateSmartManagerPoles extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (!message.mentions.has(client.user.id)) return;

        const User = await Users.findOne({discordId: message.author.id})
        if (!invertedPoleCategoryIds.has(message.channel.parent.id)) return;
        if (!User.isResponsable) return;

        await message.react(client.loadingEmoji)

        const Manager = new SmartAIPoles(client, User.roleResponsable)
        const response = await Manager.userInput(message.content)

        if (response.finish_reason === "function_call") {
            console.log(response.message.function_call)
            switch (response.message.function_call.name) {
                case "cancel-event": {
                    let args = JSON.parse(response.message.function_call.arguments)
                    let cancelEventResponse = await cancelEvent(message.guild, args.eventID)
                    let functionResponse = await Manager.functionInput(cancelEventResponse, 'cancel-event')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                case "edit-event": {
                    let editEventResponse = await editEvent(message.guild, JSON.parse(response.message.function_call.arguments))
                    let functionResponse = await Manager.functionInput(editEventResponse, 'edit-event')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                case "create-events": {
                    let args = JSON.parse(response.message.function_call.arguments)
                    let createEventsResponse = await createEvents(message.guild, User.roleResponsable, args)
                    let functionResponse = await Manager.functionInput(createEventsResponse, 'create-events')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                default: {
                    await message.reply(`<:x_:1137419292946727042> Function ${response.message.function_call.name} not found`)
                    break;
                }
            }
        } else {
            if (response.message.content.length > 2000) {
                await message.reply(`<:x_:1137419292946727042> La réponse dépasse la limite de 2000 caractères`)
                await message.reactions.removeAll()
                await message.react('<:alerttriangleyellow:1137390607069888593>')
                return;
            }
            await message.reply(response.message.content)
        }

        await message.reactions.removeAll()
        await message.react('<:check:1137387353846063184>')
    }
}