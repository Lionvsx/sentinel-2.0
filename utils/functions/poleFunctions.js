const {DateTime} = require("luxon");
const {MessageEmbed} = require("discord.js");
const Events = require("../../src/schemas/EventSchema");
const {minutesToHHMM} = require("./systemFunctions");
const {Types} = require("mongoose");
const {
    createEmojiButton,
    createMessageActionRow
} = require("./messageComponents");

const StaffChannels = new Map([
    ['da', '741810169700286544'],
    ['com', '742069661495066774'],
    ['event', '1019911006547365938'],
    ['webtv', '741961820876570724'],
    ['bureau', '745329506570731671'],
    ['partenariat', '894736312660275270'],
    ['esport', '742069647679160411']
]);

const EmojiTypes = new Map([
    ['team-building', '<:users:1137390672194850887>'],
    ['meeting', '<:coffee:1137422686432272446>'],
    ['event', '<:calendar:1137424147056689293>'],
    ['other', '<:calendar:1137424147056689293>'],
]);

async function editEvent(guild, functionArgs) {
    let event = await Events.findOne({ id: functionArgs.eventID });
    if (!event) return "Event not found"

    let outputMessage = []

    if (functionArgs.newDate) {
        const newDate = DateTime.fromISO(functionArgs.newDate, {zone: 'Europe/Paris'});
        let unixTimestamp = newDate.toSeconds();

        let oldDate = DateTime.fromSeconds(event.discordTimestamp, {zone: 'Europe/Paris'});

        if (event.discordTimestamp !== unixTimestamp) {
            // Send message to all event participants
            let eventParticipants = event.rsvps.map(rsvp => rsvp.userId);
            for (const participant of eventParticipants) {
                let user = await guild.members.fetch(participant);
                let dmChannel = await user.createDM();
                dmChannel.send({
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`<:editpen:1137390632445431950> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été modifié et commence <t:${unixTimestamp}:R>`)
                            .setColor("#2b2d31")
                    ]
                });
            }
        }
        event.discordTimestamp = unixTimestamp;

        outputMessage.push(`Event ${event.name} that started at ${oldDate.toFormat('F')} has been edited to start at ${newDate.toFormat('F')}`)
    }

    if (functionArgs.newSlots) {
        event.slots = functionArgs.newSlots;
        outputMessage.push(`Event ${event.name} slots has been edited to ${functionArgs.newSlots}`)
    }

    if (functionArgs.newDuration) {
        event.duration = functionArgs.newDuration;
        outputMessage.push(`Event ${event.name} duration has been edited to ${functionArgs.newDuration}`)
    }

    if (functionArgs.newDescription) {
        event.description = functionArgs.newDescription;
        outputMessage.push(`Event ${event.name} description has been edited to ${functionArgs.newDescription}`)
    }

    if (functionArgs.newName) {
        event.name = functionArgs.newName;
        outputMessage.push(`Event ${event.name} name has been edited to ${functionArgs.newName}`)
    }



    let annoncesChannel = guild.channels.cache.get(StaffChannels.get(event.pole));
    let eventMessage = await annoncesChannel.messages.fetch(event.messageId);

    await event.save();

    let eventEmbed = updateEventEmbed(event);
    eventMessage.edit({
        embeds: [eventEmbed]
    });

    return outputMessage.join('\n')
}

async function createEvents(guild, pole, responseData) {
    let resultMessages = []
    for (const event of responseData.events) {
        const myId = Types.ObjectId();

        let unixTimestamp = DateTime.fromISO(event.date, {zone: 'Europe/Paris'}).toSeconds();

        let dbEvent = await Events.create({
            name: event.eventName,
            type: event.eventType,
            attendance: true,
            discordTimestamp: unixTimestamp,
            duration: event.duration,
            slots: event.slots,
            pole: pole,
            description: event.informations
        });

        const eventEmbed = updateEventEmbed(dbEvent)
        let buttonAccept = createEmojiButton(`acceptEventPole|${myId}`, '', 'SECONDARY', '<:usercheck:1137390666490589274>')
        let buttonMaybe = createEmojiButton(`maybeEventPole|${myId}`, '', 'SECONDARY', '<:userplus3:1153405260812005547>')
        let buttonDecline = createEmojiButton(`declineEventPole|${myId}`, '', 'SECONDARY', '<:userx:1137394869812351006>')
        let buttonSettings = createEmojiButton(`eventSettingsPole|${myId}`, '', 'SECONDARY', '<:settings2:1153405967409623141>')

        let annoncesChannel = guild.channels.cache.get(StaffChannels.get(pole));
        let eventMessage = await annoncesChannel.send({
            embeds: [eventEmbed],
            components: [
                createMessageActionRow([buttonAccept, buttonMaybe, buttonDecline, buttonSettings])
            ]
        })

        dbEvent.messageId = eventMessage.id
        await dbEvent.save()

        resultMessages.push(`Event ${event.eventName} created successfully`)
    }
    return resultMessages.join('\n')
}

function updateEventEmbed(event) {
    let playerYes = event.rsvps.filter(rsvp => rsvp.attending === "yes");
    let playerMaybe = event.rsvps.filter(rsvp => rsvp.attending === "maybe");
    let playerNo = event.rsvps.filter(rsvp => rsvp.attending === "no");

    let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${event.discordTimestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(event.duration)}\n`

    embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` ${playerYes.length}/${event.slots}`

    if (event.link) {
        let linkDomain = event.link.split('/')[2]
        linkDomain = linkDomain.replace('www.', '')
        embedDescription += `\n<:link:1137424150764474388> \` LIEN \` [${linkDomain.toUpperCase()}](${event.link})`
    }

    if (event.description) {
        embedDescription += `\n<:messagesquare:1137390645972049970> \` INFOS \`\n${event.description}\n`
    }

    return new MessageEmbed()
        .setTitle(`${EmojiTypes.get(event.type)} \` ${event.name} \``)
        .setColor('#2b2d31')
        .setDescription(embedDescription)
        .addFields([
            {
                name: '<:check:1137390614296678421> ` CONFIRMES `',
                value: playerYes.length > 0 ? playerYes.map(player => `<@${player.userId}>`).join('\n') : '\u200b',
                inline: true
            },
            {
                name: '<:users:1137390672194850887> ` PEUT-ÊTRE `',
                value: playerMaybe.length > 0 ? playerMaybe.map(player => `<@${player.userId}>`).join('\n') : '\u200b',
                inline: true
            },
            {
                name: '<:x_:1137419292946727042> ` INDISPONIBLES `',
                value: playerNo.length > 0 ? playerNo.map(player => `<@${player.userId}>`).join('\n') : '\u200b',
                inline: true
            }
        ])
}

async function cancelEvent(guild, eventID) {
    let event = await Events.findOne({ id: eventID })
    if (!event) return "Event not found"

    // Send message to all event participants
    let eventParticipants = event.rsvps.map(rsvp => rsvp.userId)
    for (const participant of eventParticipants) {
        let user = await guild.members.fetch(participant)
        let dmChannel = await user.createDM()
        dmChannel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`<:trash:1137390663797841991> L'événement \` ${event.name} \` qui débutait <t:${event.discordTimestamp}:R> a été annulé`)
                    .setColor("#2b2d31")
            ]
        })
    }

    let annoncesChannel = guild.channels.cache.get(StaffChannels.get(event.pole))
    let eventMessage = await annoncesChannel.messages.fetch(event.messageId)

    eventMessage.delete()
    Events.findByIdAndDelete(eventID)

    return `Event ${event.name} has been cancelled`
}

module.exports = {
    editEvent,
    createEvents,
    cancelEvent,
    updateEventEmbed
}