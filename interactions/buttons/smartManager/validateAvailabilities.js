const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const SmartAIScheduler = require("../../../ai/SmartAIScheduler");
const {MessageEmbed} = require("discord.js");
const {createEmojiButton, createMessageActionRow} = require("../../../utils/functions/messageComponents");


module.exports = class ValidateAvailabilities extends BaseInteraction {
    constructor() {
        super('validateAvailabilities', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let Team = await Teams.findOne({linkedCategoryId: buttonArgs[1]})
        if (!Team.smartManager) return interaction.reply({
            content: '<:x_:1137419292946727042> Le smart manager n\'est pas activé pour cette équipe',
        })

        if (!Team.availabilitiesAnswered) Team.availabilitiesAnswered = 0

        let ldvGuild = await client.guilds.fetch('227470914114158592')

        let teamCategory = await ldvGuild.channels.fetch(Team.linkedCategoryId)
        let staffChannel = teamCategory.children.find(channel => channel.name.includes('staff'))


        if (Team.playersAnswered.includes(interaction.user.id)) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous avez déjà confirmé vos disponibilités pour la semaine',
        })

        Team.availabilitiesAnswered++
        Team.playersAnswered.push(interaction.user.id)
        await Team.save()

        staffChannel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`<:check:1137387353846063184> \` ${interaction.user.username} \` a confirmé ses disponibilités pour la semaine`)
                    .setColor('#2b2d31')
            ]
        })

        // Make the button disabled
        interaction.message.components[0].components[0].setDisabled(true).setLabel("Disponibilités confirmées, vous pouvez toujours les modifier si nécessaire")
        await interaction.update({components: interaction.message.components})

        if (Team.availabilitiesAnswered >= Team.minPlayers && !Team.planningSent) {
            let smartScheduler = new SmartAIScheduler(client, Team)
            let possiblePlanning = await smartScheduler.loadTeamData(Team)
            Team.planningSent = true
            await Team.save()
            if (!possiblePlanning) return staffChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<:x_:1137419292946727042> Impossible de générer un planning avec les disponibilités actuelles des joueurs`)
                        .setColor('#2b2d31')
                ]
            })
            let response = await smartScheduler.callGPT()

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
                const unixTimestamp = Math.floor(new Date(event.date).getTime() / 1000);
                let eventEmbed = new MessageEmbed()
                    .setTitle(title)
                    .setDescription(`<:calendar:1137424147056689293> \` DATE \` <t:${unixTimestamp}>\n<:clock:1139536765837901916> \` TEMPS \` ${event.duration}\n<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.numberOfGames}`)
                    .setColor('#2b2d31')

                // ADD Button + to add event to calendar
                let addEventButton = createEmojiButton(`addTeamEvent|${event.eventType}|${unixTimestamp}|${event.duration}|${event.numberOfGames}|${event.RSVP}`, 'Créer l\'évènement', 'SECONDARY', '<:pluscircle:1137390650690650172>')

                staffChannel.send({
                    embeds: [eventEmbed],
                    components: [
                        createMessageActionRow([addEventButton])
                    ]
                })
            }
        }
    }
}