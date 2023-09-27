const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {MessageEmbed} = require("discord.js");
const {createEmojiButton, createMessageActionRow} = require("../../../utils/functions/messageComponents");
const {Types} = require("mongoose");
const {minutesToHHMM} = require("../../../utils/functions/systemFunctions");


module.exports = class AddTeamEvent extends BaseInteraction {
    constructor() {
        super('addTeamEvent', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let parentCategoryId = interaction.channel.parent.id
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})
        let eventType = buttonArgs[1]
        let timestamp = buttonArgs[2]
        let duration = buttonArgs[3]
        let nbGames = buttonArgs[4]
        let RSVP = buttonArgs[5]

        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
        });

        if (!Team.smartManager) return interaction.reply({
            content: '<:x_:1137419292946727042> Le smart manager n\'est pas activé pour cette équipe',
        })

        let organisationChannel = interaction.channel.parent.children.find(channel => channel.name.includes('organisation'))

        let title
        switch (eventType) {
            case 'entrainement':
                title = '<:zap:1137424324144410736> ` ENTRAINEMENT `'
                break
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

        // Disable button
        interaction.message.components[0].components[0].setDisabled(true).setLabel("Event ajouté")
        await interaction.update({components: interaction.message.components})

        let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${timestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(duration)}\n`

        if (eventType !== 'review' && eventType !== 'team-building') {
            embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${nbGames}\n`
        }
        if (RSVP) {
            embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` 0/${Team.minPlayers}`
        }

        let eventEmbed = new MessageEmbed()
            .setTitle(title)
            .setColor('#2b2d31')
            .setDescription(embedDescription)

        const myId = Types.ObjectId();

        let buttonAccept = createEmojiButton(`acceptEvent|${myId}`, '', 'SECONDARY', '<:usercheck:1137390666490589274>')
        let buttonMaybe = createEmojiButton(`maybeEvent|${myId}`, '', 'SECONDARY', '<:userplus3:1153405260812005547>')
        let buttonDecline = createEmojiButton(`declineEvent|${myId}`, '', 'SECONDARY', '<:userx:1137394869812351006>')
        let buttonSettings = createEmojiButton(`eventSettings|${myId}`, '', 'SECONDARY', '<:settings2:1153405967409623141>')

        let eventMessage
        if (RSVP) {
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
            eventMessage = await organisationChannel.send({
                content: "<@&" + Team.linkedRoleId + ">",
                embeds: [eventEmbed],
                components: [
                    createMessageActionRow([buttonAccept, buttonMaybe, buttonDecline, buttonSettings])
                ]
            })
        } else {
            eventMessage = await organisationChannel.send({
                content: "<@&" + Team.linkedRoleId + ">",
                embeds: [eventEmbed]
            })
        }

        Team.events.push({
            _id: myId,
            name: title,
            type: eventType,
            attendance: RSVP,
            discordTimestamp: timestamp,
            duration: duration,
            nbGames: nbGames,
            slots: Team.minPlayers,
            messageId: eventMessage.id
        })
        await Team.save()
    }
}