const Teams = require("../../src/schemas/TeamSchema");
const {getNotionPageById} = require("./notionFunctions");
const {MessageEmbed, TextChannel} = require("discord.js");
const {
    createButtonActionRow,
    createEmojiButton, createMessageActionRow
} = require("./messageComponents");
const {minutesToHHMM, getCurrentWeekNumber,
    getDateOfCurrentWeek,
    getDateOfToday
} = require("./systemFunctions");
const { DateTime } = require('luxon');
const {Types} = require("mongoose");
async function updateTeamChannels(guild, teamCategory, role, staffPermissions) {
    let childChannels = teamCategory.children
    let organisationChannel = childChannels.find(channel => channel.name === "📌┃organisation")
    let discussionChannel = childChannels.find(channel => channel.name === "💬┃discussion")
    let filesChannel = childChannels.find(channel => channel.name === "📒┃fichiers")
    let staffChannel = childChannels.find(channel => channel.name === "🔗┃staff")
    let dashboardChannel = childChannels.find(channel => channel.name === "🧭┃dashboard")
    let teamVocalChannel = childChannels.find(channel => channel.name === "🔊┃Team Vocal")
    let coachChannel = childChannels.find(channel => channel.name === "🔎┃Coach")

    if (!organisationChannel) {
        await guild.channels.create(`📌┃organisation`, {
            type: 'GUILD_TEXT',
            position: 1,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: role.id,
                    allow: ['VIEW_CHANNEL']
                },
                {
                    id: '624715536693198888',
                    allow: ['SEND_MESSAGES']
                }
            ],
            parent: teamCategory
        })
    } else {
        await organisationChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false
        })
        await organisationChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true
        })
        await organisationChannel.permissionOverwrites.edit('624715536693198888', {
            SEND_MESSAGES: true
        })
    }
    if (!discussionChannel) {
        await guild.channels.create(`💬┃discussion`, {
            type: 'GUILD_TEXT',
            position: 2,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: role.id,
                    allow: ['VIEW_CHANNEL']
                }
            ],
            parent: teamCategory
        })
    } else {
        await discussionChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false
        })
        await discussionChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true
        })
    }
    if (!filesChannel) {
        await guild.channels.create(`📒┃fichiers`, {
            type: 'GUILD_TEXT',
            position: 3,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
                },
                {
                    id: role.id,
                    allow: ['VIEW_CHANNEL']
                },
                {
                    id: '624715536693198888',
                    allow: ['SEND_MESSAGES']
                }
            ],
            parent: teamCategory
        })
    } else {
        await filesChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false
        })
        await filesChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true
        })
        await filesChannel.permissionOverwrites.edit('624715536693198888', {
            SEND_MESSAGES: true
        })
    }
    if (!staffChannel) {
        await guild.channels.create(`🔗┃staff`, {
            type: 'GUILD_TEXT',
            position: 4,
            permissionOverwrites: staffPermissions,
            parent: teamCategory
        })
    } else {
        await staffChannel.permissionOverwrites.set(staffPermissions)
    }
    if (!dashboardChannel) {
        await guild.channels.create(`🧭┃dashboard`, {
            type: 'GUILD_TEXT',
            position: 5,
            permissionOverwrites: staffPermissions,
            parent: teamCategory
        }).then(channel => sendTeamsDashboard(channel))
    } else {
        await dashboardChannel.permissionOverwrites.set(staffPermissions)
        await dashboardChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            SEND_MESSAGES: false
        })
    }
    if (!teamVocalChannel) {
        await guild.channels.create(`🔊┃Team Vocal`, {
            type: 'GUILD_VOICE',
            position: 6,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL']
                },
                {
                    id: role.id,
                    allow: ['VIEW_CHANNEL']
                }
            ],
            parent: teamCategory
        })
    } else {
        await teamVocalChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false
        })
        await teamVocalChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true
        })
    }
    if (!coachChannel) {
        await guild.channels.create(`🔎┃Coach`, {
            type: 'GUILD_VOICE',
            position: 8,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL', 'CONNECT']
                },
                {
                    id: role.id,
                    allow: ['VIEW_CHANNEL']
                },
                {
                    id: '624715536693198888',
                    allow: ['CONNECT']
                }
            ],
            parent: teamCategory
        })
    } else {
        await coachChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false
        })
        await coachChannel.permissionOverwrites.edit(role.id, {
            VIEW_CHANNEL: true
        })
    }
}

function updateEventEmbed(event) {
    let playerYes = event.rsvps.filter(rsvp => rsvp.attending === "yes");
    let playerMaybe = event.rsvps.filter(rsvp => rsvp.attending === "maybe");
    let playerNo = event.rsvps.filter(rsvp => rsvp.attending === "no");

    let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${event.discordTimestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(event.duration)}\n`

    if (event.type !== 'review' && event.type !== 'team-building' && event.type !== 'tournament') {
        embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.nbGames}\n`
    }
    embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` ${playerYes.length}/${event.slots}`

    if (event.trackerLink) {
        let trackerLinkDomain = event.trackerLink.split('/')[2]
        trackerLinkDomain = trackerLinkDomain.replace('www.', '')
        embedDescription += `\n<:link:1137424150764474388> \` TRACKER \` [${trackerLinkDomain.toUpperCase()}](${event.trackerLink})`
    }

    if (event.description) {
        embedDescription += `\n<:messagesquare:1137390645972049970> \` INFOS \`\n${event.description}\n`
    }

    return new MessageEmbed()
        .setTitle(event.name)
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

function updatePastEventEmbed(event) {
    let title = `<:checkcircle:1137390611213865030> \` ${event.type.toUpperCase()} FINISHED \``
    let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${event.discordTimestamp}:F>`
    if (event.type !== 'review' && event.type !== 'team-building' && event.type !== 'tournament') {
        embedDescription += `\n<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.nbGames}`
    }
    if (event.trackerLink) {
        let trackerLinkDomain = event.trackerLink.split('/')[2]
        trackerLinkDomain = trackerLinkDomain.replace('www.', '')
        embedDescription += `\n<:link:1137424150764474388> \` TRACKER \` [${trackerLinkDomain.toUpperCase()}](${event.trackerLink})`
    }

    if (event.score) {
        embedDescription += `\n<:crosshair:1137436482248904846> \` SCORE \` ${event.score}`
    }

    if (event.result) {
        embedDescription += `\n<:flag:1153289152536772659> \` RESULTAT \` ${event.result}`
    }

    if (event.description) {
        embedDescription += `\n<:messagesquare:1137390645972049970> \` INFOS \`\n${event.description}\n`
    }



    return new MessageEmbed()
        .setTitle(title)
        .setColor('#2b2d31')
        .setDescription(embedDescription)
}

async function cleanTeams(guild) {
    let allDBTeams = await Teams.find()

    for (const team of allDBTeams) {
        let notionTeam = await getNotionPageById(team.linkedNotionPageId)
        let teamRole = guild.roles.cache.get(team.linkedRoleId)
        let teamCategory = guild.channels.cache.get(team.linkedCategoryId)
        if (!teamCategory) {
            await Teams.deleteOne({linkedCategoryId: team.linkedCategoryId})
            continue;
        }
        if (notionTeam.archived === true) {
            let childChannels = teamCategory.children
            for (const [, channel] of childChannels) {
                await channel.delete()
            }
            await Teams.deleteOne({linkedCategoryId: team.linkedCategoryId})
            await teamCategory.delete()
            await teamRole.delete()
        }
    }
}


/**
 *
 * @param teamNotionPage
 * @returns {Promise<*[][]>}
 */
async function getTeamStaff(teamNotionPage) {
    let staff = []
    let managers = []
    let coachs = []
    for (const page of teamNotionPage.properties["🏆 Coach"].relation) {
        let notionUser = await getNotionPageById(page.id)
        let discordUserId = notionUser.properties["Discord ID"].rich_text[0].plain_text
        staff.push(discordUserId)
        coachs.push(discordUserId)
    }

    for (const page of teamNotionPage.properties["🧢 Manager"].relation) {
        let notionUser = await getNotionPageById(page.id)
        let discordUserId = notionUser.properties["Discord ID"].rich_text[0].plain_text
        staff.push(discordUserId)
        managers.push(discordUserId)
    }
    return [staff, managers, coachs]
}

/**
 *
 * @param teamNotionPage
 * @returns {Promise<*[]>}
 */
async function getTeamMembers(teamNotionPage) {
    let members = []
    for (const page of teamNotionPage.properties["👥 Membres"].relation) {
        let notionUser = await getNotionPageById(page.id)
        let discordUserId = notionUser.properties["Discord ID"].rich_text[0].plain_text
        members.push(discordUserId)
    }
    for (const page of teamNotionPage.properties["📱 CM"].relation) {
        let notionUser = await getNotionPageById(page.id)
        let discordUserId = notionUser.properties["Discord ID"].rich_text[0].plain_text
        members.push(discordUserId)
    }
    return members
}

/**
 *
 * @param channel {TextChannel}
 * @returns {Promise<void>}
 */
async function sendTeamsDashboard(channel) {
    const DashBoardTeam = new MessageEmbed()
        .setColor('#2b2d31')
        .setTitle(`<:toggleleft:1138440738649149472> \` SMART MANAGER : OFF\``)
        .setDescription(`Bienvenue dans l'interface de gestion d'équipe de Sentinel.\nLe smart manager est une feature qui permet de gérer automatiquement les évènements de votre équipe.\nIl est désactivé par défaut, vous pouvez l'activer en cliquant sur le bouton ci-dessous.`)
        .addFields(
            { name: '<:pluscircle:1137390650690650172> | ` CREATE CHANNEL `', value: "Crée un salon", inline: false },
            { name: '<:minuscircle:1137390648262135951> | ` DELETE CHANNEL `', value: "Supprime un salon", inline: false },
            { name: '<:userplus:1137394694972788837> | ` ADD SUB `', value: 'Donne des accès temporaires à l\'équipe', inline: false },
            { name: '<:userminus:1137394849025359992> | ` REMOVE SUB `', value: 'Retire des accès temporaires à l\'équipe', inline: false },
            { name: '<:settings:1137410884432564404> | ` SMART MANAGER `', value: "Configure le smart manager", inline: false },
        )
    const Row1 = createButtonActionRow([
        createEmojiButton(`buttonCreateChannelTeams|${channel.parent.id}`, '', 'SECONDARY', '<:pluscircle:1137390650690650172>'),
        createEmojiButton(`buttonDeleteChannelTeams|${channel.parent.id}`, '', 'SECONDARY', '<:minuscircle:1137390648262135951>'),
        createEmojiButton(`buttonAddSub|${channel.parent.id}`, '', 'SECONDARY', '<:userplus:1137394694972788837>'),
        createEmojiButton(`buttonRemoveSub|${channel.parent.id}`, '', 'SECONDARY', '<:userminus:1137394849025359992>'),
        createEmojiButton(`buttonSMConfig|${channel.parent.id}`, '', 'SECONDARY', '<:settings:1137410884432564404>'),
    ])
    channel.send({
        embeds: [DashBoardTeam],
        components: [Row1]
    })
}

async function updateTeamsDashboard(channel, smState) {
    let messages = await channel.messages.fetch({ limit: 10 })
    let dashboardMessage = messages.find(m => m.author.id === channel.client.user.id)

    let title = smState ? "<:toggleright:1138440735230804018> \` SMART MANAGER : ON\`" : "<:toggleleft:1138440738649149472> \` SMART MANAGER : OFF\`"

    const DashboardTeam = new MessageEmbed()
        .setColor('#2b2d31')
        .setTitle(title)
        .addFields(
            { name: '<:pluscircle:1137390650690650172> | ` CREATE CHANNEL `', value: "Crée un salon", inline: false },
            { name: '<:minuscircle:1137390648262135951> | ` DELETE CHANNEL `', value: "Supprime un salon", inline: false },
            { name: '<:userplus:1137394694972788837> | ` ADD SUB `', value: 'Donne des accès temporaires à l\'équipe', inline: false },
            { name: '<:userminus:1137394849025359992> | ` REMOVE SUB `', value: 'Retire des accès temporaires à l\'équipe', inline: false },
            { name: '<:settings:1137410884432564404> | ` SMART MANAGER `', value: "Reconfigure et reset le smart manager", inline: false },
            { name: '<:calendar:1137424147056689293> | ` ASK PLAYER CALENDAR `', value: "Rappel aux joueurs de remplir leurs dispos", inline: false },
            { name: '<:eye:1137390637323403394> | ` SHOW CALENDAR `', value: "Affiche les dispos des joueurs", inline: false },
        )

    const buttonArrayR1 = [
        createEmojiButton(`buttonCreateChannelTeams|${channel.parent.id}`, '', 'SECONDARY', '<:pluscircle:1137390650690650172>'),
        createEmojiButton(`buttonDeleteChannelTeams|${channel.parent.id}`, '', 'SECONDARY', '<:minuscircle:1137390648262135951>'),
        createEmojiButton(`buttonAddSub|${channel.parent.id}`, '', 'SECONDARY', '<:userplus:1137394694972788837>'),
        createEmojiButton(`buttonRemoveSub|${channel.parent.id}`, '', 'SECONDARY', '<:userminus:1137394849025359992>'),
    ]

    const Row1 = createButtonActionRow(buttonArrayR1)

    let buttonArrayR2;

    if (smState) buttonArrayR2 = [
        createEmojiButton(`buttonSMConfig|${channel.parent.id}`, '', 'SECONDARY', '<:settings:1137410884432564404>'),
        createEmojiButton(`askTeamPlanning|${channel.parent.id}`, '', 'SECONDARY', `<:calendar:1137424147056689293>`),
        createEmojiButton(`viewTeamPlanning|${channel.parent.id}`, '', 'SECONDARY', '<:eye:1137390637323403394>'),
        createEmojiButton(`buttonSMOff|${channel.parent.id}`, '', 'SECONDARY', '<:toggleleft:1138440738649149472>'),
        ]
    else buttonArrayR2 = [
        createEmojiButton(`buttonSMConfig|${channel.parent.id}`, '', 'SECONDARY', '<:settings:1137410884432564404>').setDisabled(true),
        createEmojiButton(`askTeamPlanning|${channel.parent.id}`, '', 'SECONDARY', `<:calendar:1137424147056689293>`).setDisabled(true),
        createEmojiButton(`viewTeamPlanning|${channel.parent.id}`, '', 'SECONDARY', '<:eye:1137390637323403394>').setDisabled(true),
        createEmojiButton(`buttonSMOn|${channel.parent.id}`, '', 'SECONDARY', '<:toggleright:1138440735230804018>')
    ]

    const RowSM = createButtonActionRow(buttonArrayR2)

    dashboardMessage.edit({
        embeds: [DashboardTeam],
        components: [Row1, RowSM]
    })
}

async function createTeamChannels(guild, teamCategory, role, staffPermissions) {
    await guild.channels.create(`📌┃organisation`, {
        type: 'GUILD_TEXT',
        position: 1,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            },
            {
                id: role.id,
                allow: ['VIEW_CHANNEL']
            },
            {
                id: '624715536693198888',
                allow: ['SEND_MESSAGES']
            }
        ],
        parent: teamCategory
    })
    await guild.channels.create(`💬┃discussion`, {
        type: 'GUILD_TEXT',
        position: 2,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL']
            },
            {
                id: role.id,
                allow: ['VIEW_CHANNEL']
            }
        ],
        parent: teamCategory
    })
    await guild.channels.create(`📒┃fichiers`, {
        type: 'GUILD_TEXT',
        position: 3,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            },
            {
                id: role.id,
                allow: ['VIEW_CHANNEL']
            },
            {
                id: '624715536693198888',
                allow: ['SEND_MESSAGES']
            }
        ],
        parent: teamCategory
    })
    await guild.channels.create(`🔗┃staff`, {
        type: 'GUILD_TEXT',
        position: 4,
        permissionOverwrites: staffPermissions,
        parent: teamCategory
    })
    await guild.channels.create(`🧭┃dashboard`, {
        type: 'GUILD_TEXT',
        position: 5,
        permissionOverwrites: staffPermissions,
        parent: teamCategory
    }).then(channel => sendTeamsDashboard(channel))
    await guild.channels.create(`🔊┃Team Vocal`, {
        type: 'GUILD_VOICE',
        position: 6,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL']
            },
            {
                id: role.id,
                allow: ['VIEW_CHANNEL']
            }
        ],
        parent: teamCategory
    })
    await guild.channels.create(`🔎┃Coach`, {
        type: 'GUILD_VOICE',
        position: 8,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL', 'CONNECT']
            },
            {
                id: role.id,
                allow: ['VIEW_CHANNEL']
            },
            {
                id: '624715536693198888',
                allow: ['CONNECT']
            }
        ],
        parent: teamCategory
    })
}

async function cancelEvent(guild, Team, eventID) {
    let event = Team.events.find(event => String(event._id) === eventID)
    if (!event) return "Event not found"

    // Send message to all event participants
    let eventParticipants = event.rsvps.map(rsvp => rsvp.userId)
    for (const participant of eventParticipants) {
        let user = await guild.members.fetch(participant)
        let dmChannel = await user.createDM()
        dmChannel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`<:trash:1137390663797841991> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été annulé`)
                    .setColor("#2b2d31")
            ]
        })
    }

    let parentChannel = guild.channels.cache.get(Team.linkedCategoryId)
    let organisationChannel = parentChannel.children.find(channel => channel.name.includes('organisation'))
    let staffChannel = parentChannel.children.find(channel => channel.name.includes('staff'))
    let eventMessage = await organisationChannel.messages.fetch(event.messageId)

    staffChannel.send({
        content: "<@&624715536693198888>",
        embeds: [
            new MessageEmbed()
                .setDescription(`<:trash:1137390663797841991> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été annulé`)
                .setColor("#2b2d31")
        ]
    })

    eventMessage.delete()
    Team.events = Team.events.filter(event => String(event._id) !== eventID)
    await Team.save()

    return `Event ${event.name} with ID ${event._id} has been cancelled`
}

async function alertEvent(guild, event) {

    let participantRSVPs = event.rsvps.filter(rsvp => rsvp.attending === "yes")
    let participantDiscord = participantRSVPs.map(rsvp => guild.members.cache.get(rsvp.userId))

    for (const participant of participantDiscord) {
        let DMChannel = await participant.createDM()
        await DMChannel.send({
            embeds: [
                new MessageEmbed().setDescription(`<:bell:1153604390356271124> L'événement ${event.name} va commencer dans <t:${event.discordTimestamp}:R>`).setColor("#2b2d31")
            ]
        })
    }
}

async function alertTeamMembers(guild, Team, event) {
    let notionTeam = await getNotionPageById(Team.linkedNotionPageId)
    let teamMembers = await getTeamMembers(notionTeam)

    // Alert all teamMembers that have not RSVPed yet
    for (const member of teamMembers) {
        if (!event.find(rsvp => rsvp.userId === member)) {
            let user = await guild.members.fetch(member)
            let dmChannel = await user.createDM()
            await dmChannel.send({
                embeds: [
                    new MessageEmbed().setDescription(`<:bell:1153604390356271124> Vous n'avez pas encore répondu à l'événement ${event.name} qui va commencer dans <t:${event.discordTimestamp}:R>. Merci de le faire au plus vite`).setColor("#2b2d31")
                ]
            })
        }
    }
}

async function addAvailability(guild, Team, functionArgs, userId) {
    try {
        let returnMessage = []
        for (const avail of functionArgs.availabilities) {
            const { slotStartTime, slotEndTime, availability } = avail;

            if (!slotStartTime || !slotEndTime || !availability || !userId) {
                return "Missing arguments"
            }

            const startTime = DateTime.fromISO(slotStartTime, {zone: 'Europe/Paris'});
            const endTime = DateTime.fromISO(slotEndTime, {zone: 'Europe/Paris'});

            if (!Team) {
                return "Team not found"
            }

            let guildMember = await guild.members.fetch(userId);

            const overlappingEvents = Team.events.filter(event => {
                const eventStartTime = DateTime.fromSeconds(event.discordTimestamp).setZone('Europe/Paris');
                const eventEndTime = eventStartTime.plus({ minutes: event.duration });
                return (startTime <= eventEndTime && endTime >= eventStartTime) && event.attendance;
            });

            if (availability === 'unavailable' && overlappingEvents.length > 0) {
                for (const event of overlappingEvents) {
                    sendPlanningConflictMessage(guild, Team, event, guildMember.user.username);
                    // Update the event rsvps
                    if (event.rsvps.some(rsvp => rsvp.userId === userId)) {
                        let rsvpToUpdate = event.rsvps.find(rsvp => rsvp.userId === userId);
                        rsvpToUpdate.attending = "no";
                    } else {
                        event.rsvps.push({
                            userId: userId,
                            attending: "no"
                        });
                    }
                }
            }

            const day = startTime.toFormat('EEEE');  // Get the day of the week
            const startHour = startTime.hour;
            const endHour = endTime.hour;
            const weekNumber = getCurrentWeekNumber(startTime.toJSDate());  // Assuming getCurrentWeekNumber accepts a JS Date object

            for (let hour = startHour; hour <= endHour; hour++) {
                if (hour < 6) {
                    continue;
                }
                const existingAvailabilityIndex = Team.availabilities.findIndex(avail =>
                    avail.discordId === userId &&
                    avail.hour === hour &&
                    avail.day === day &&
                    avail.weekNumber === weekNumber
                );

                const newAvailability = {
                    day: day,
                    hour: hour,
                    weekNumber: weekNumber,
                    discordId: userId,
                    availability: availability
                };

                if (existingAvailabilityIndex !== -1) {
                    Team.availabilities[existingAvailabilityIndex] = newAvailability;
                } else {
                    Team.availabilities.push(newAvailability);
                }
            }

            await Team.save();
            const dayOfWeek = startTime.toFormat('EEEE');
            returnMessage.push(`User availabilities updated successfully on ${dayOfWeek}, from ${startTime.toISO()} to ${endTime.toISO()} with status ${availability}`);
        }
        return returnMessage.join('\n');
    } catch (error) {
        console.error(error);
        return "Error while adding availability"
    }
}

async function createEvents(guild, Team, responseData) {
    let parentCategory = guild.channels.cache.get(Team.linkedCategoryId)
    let organisationChannel = parentCategory.children.find(channel => channel.name.includes('organisation'))
    let resultMessages = []
    for (const event of responseData.events) {

        // Switch emoji on event type :
        let title = ''
        event.eventName = event.eventName.toUpperCase()
        switch (event.eventType) {
            case 'training':
                title = '<:zap:1137424324144410736> ` ' + event.eventName + ' `'
                break
            case 'pracc':
                title = '<:crosshair:1137436482248904846> ` ' + event.eventName + ' `'
                break
            case 'tournament':
                title = '<:flag:1153289152536772659> ` ' + event.eventName + ' `'
                break
            case 'scrim':
                title = '<:zap2:1137424322399571988> ` ' + event.eventName + ' `'
                break
            case 'team-building':
                title = '<:users:1137390672194850887> ` ' + event.eventName + ' `'
                break
            case 'review':
                title = '<:search:1153289155405680721> ` ' + event.eventName + ' `'
                break
            case 'entrainement':
                title = '<:zap:1137424324144410736> ` ' + event.eventName + ' `'
                break
            default:
                title = '<:calendar:1137424147056689293> ` ' + event.eventName + ' `'
                break
        }
        const unixTimestamp = Math.floor(new Date(event.date).getTime() / 1000);

        let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${unixTimestamp}:F>\n<:clock:1139536765837901916> \` DURÉE \` ${minutesToHHMM(event.duration)}\n`

        if (event.eventType !== 'review' && event.eventType !== 'team-building' && event.eventType !== 'tournament') {
            embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.numberOfGames}\n`
        }
        let requiredPlayers = Team.minPlayers
        if (event.requiredPlayers || event.requiredPlayers !== 0) {
            requiredPlayers = event.requiredPlayers
        }
        embedDescription += `<:pluscircle:1137390650690650172> \` JOINED \` 0/${requiredPlayers}`


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
            slots: requiredPlayers,
            messageId: eventMessage.id
        })
        await Team.save()
        resultMessages.push(`Event ${event.eventName} created successfully`)
    }
    return resultMessages.join('\n')
}
function sendPlanningConflictMessage(guild, Team, event, displayName) {
    let staffChannel = guild.channels.cache.get(Team.linkedCategoryId).children.find(channel => channel.name.includes('staff'))

    let findSubButton = createEmojiButton(`findSub|${event.id}`, 'Find Sub', 'SECONDARY', '<:usersub:1139216889231462471>')
    let cancelEventButton = createEmojiButton(`cancelEvent|${event.id}`, 'Cancel', 'SECONDARY', '<:trash:1137390663797841991>')
    let rescheduleEventButton = createEmojiButton(`rescheduleEvent|${event.id}`, 'Auto Reschedule', 'SECONDARY', '<:repeat:1156640382210289734>')

    let decisionEmbed = new MessageEmbed()
        .setTitle(`<:alerttriangleyellow:1137390607069888593> \` CONFLIT DE PLANNING \``)
        .setDescription(`Le joueur ${displayName} est indisponible pour l'événement ${event.name} qui débute <t:${event.discordTimestamp}:R>`)
        .setColor('#2b2d31')

    staffChannel.send({
        content: "<@&624715536693198888>",
        embeds: [decisionEmbed],
        components: [createButtonActionRow([findSubButton, cancelEventButton, rescheduleEventButton])]
    })
}

function getCurrentPlayerAvailability(Team, userId) {
    const weekNumber = getCurrentWeekNumber();


    const availabilities = Team.availabilities.filter(avail =>
        avail.discordId === userId &&
        avail.weekNumber === weekNumber &&
        avail.availability === 'available'
    );

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

        // Group by hour
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

    if (availabilities.length === 0) {
        return "No availability found for the current week for this user";
    }

    return "User is available at the following times:\n" + formattedSlots.join('\n');
}

async function editEvent(guild, Team, functionArgs) {
    let event = Team.events.find(event => String(event._id) === functionArgs.eventID)
    if (!event) return "Event not found"

    const newDate = DateTime.fromISO(functionArgs.newDate, {zone: 'Europe/Paris'});
    let newDuration = functionArgs.newDuration;
    let newNumberOfGames = functionArgs.newNumberOfGames;
    let unixTimestamp = newDate.toSeconds();

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

    let oldDate = DateTime.fromSeconds(event.discordTimestamp, {zone: 'Europe/Paris'});

    let parentChannel = guild.channels.cache.get(Team.linkedCategoryId);
    let organisationChannel = parentChannel.children.find(channel => channel.name.includes('organisation'));
    let staffChannel = parentChannel.children.find(channel => channel.name.includes('staff'));
    let eventMessage = await organisationChannel.messages.fetch(event.messageId);

    staffChannel.send({
        content: "<@&624715536693198888>",
        embeds: [
            new MessageEmbed()
                .setDescription(`<:editpen:1137390632445431950> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:F> a été modifié et commence <t:${unixTimestamp}:F>`)
                .setColor("#2b2d31")
        ]
    });

    event.discordTimestamp = unixTimestamp;
    event.duration = newDuration;
    event.nbGames = newNumberOfGames;
    await Team.save();

    let eventEmbed = updateEventEmbed(event);  // Assuming updateEventEmbed is defined elsewhere in your code
    eventMessage.edit({
        embeds: [eventEmbed]
    });

    return `Event ${event.name} that started at ${oldDate.toFormat('F')} has been edited to start at ${newDate.toFormat('F')} and last ${newDuration} minutes with ${newNumberOfGames} games`;
}

module.exports = {
    getTeamStaff,
    getTeamMembers,
    sendTeamsDashboard,
    createTeamChannels,
    updateTeamChannels,
    cleanTeams,
    updateTeamsDashboard,
    updateEventEmbed,
    updatePastEventEmbed,
    cancelEvent,
    alertEvent,
    editEvent,
    alertTeamMembers,
    addAvailability,
    getCurrentPlayerAvailability,
    createEvents
}