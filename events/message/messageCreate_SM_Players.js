const BaseEvent = require('../../utils/structures/BaseEvent');
const Teams = require('../../src/schemas/TeamSchema');
const SmartAIManager = require("../../ai/SmartAIManager");
const {cancelEvent, editEvent, addAvailability, createEvents} = require("../../utils/functions/teamsFunctions");
module.exports = class MessageCreateSmartManagerPlayers extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (!message.mentions.has(client.user.id)) return;

        if (message.channel.name === '📌┃organisation') return;
        let parentChannelID = message.channel.parent.id;
        let Team = await Teams.findOne({linkedCategoryId: parentChannelID});

        if (!Team || !Team.smartManager) return;

        await message.react(client.loadingEmoji)

        let teamRole = message.guild.roles.cache.get(Team.linkedRoleId)
        let teamMembers = teamRole.members.filter(m => !m.roles.cache.has('1138459577734680577') && !m.roles.cache.has('624715536693198888'))
        let staffMembers = teamRole.members.filter(m => m.roles.cache.has('624715536693198888'))

        const Manager = new SmartAIManager(client)
        let response
        if (teamMembers.has(message.author.id)) {
            response = await Manager.userInput(client, message.content, Team, message.author.id)
        } else if (staffMembers.has(message.author.id)) {
            response = await Manager.staffInput(client, message.content, Team)
        } else {
            await message.reactions.removeAll()
            await message.react('<:x_:1137419292946727042>')
            message.reply("Vous n'avez pas la permission d'utiliser le Smart Manager")
            return;
        }

        if (response.finish_reason === "function_call") {
            console.log(response.message.function_call)
            switch (response.message.function_call.name) {
                case "cancel-event": {
                    let args = JSON.parse(response.message.function_call.arguments)
                    let cancelEventResponse = await cancelEvent(message.guild, Team, args.eventID)
                    let functionResponse = await Manager.functionInput(cancelEventResponse, 'cancel-event')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                case "edit-event": {
                    let editEventResponse = await editEvent(message.guild, Team, JSON.parse(response.message.function_call.arguments))
                    let functionResponse = await Manager.functionInput(editEventResponse, 'edit-event')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                case "add-availability": {
                    let args = JSON.parse(response.message.function_call.arguments)
                    let addAvailabilityResponse = await addAvailability(message.guild, Team, args, message.author.id)
                    let functionResponse = await Manager.functionInput(addAvailabilityResponse, 'add-availability')
                    await message.reply(functionResponse.message.content)
                    break;
                }
                case "create-events": {
                    let args = JSON.parse(response.message.function_call.arguments)
                    let createEventsResponse = await createEvents(message.guild, Team, args)
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