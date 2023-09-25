const Teams = require("../../src/schemas/TeamSchema");
const {getNotionPageById} = require("./notionFunctions");
const {MessageEmbed, TextChannel} = require("discord.js");
const {
    createButtonActionRow,
    createEmojiButton
} = require("./messageComponents");
const {minutesToHHMM} = require("./systemFunctions");

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
                value: playerYes.length > 0 ? playerYes.map(player => `<@!${player.userId}>`).join('\n') : '\u200b',
                inline: true
            },
            {
                name: '<:users:1137390672194850887> ` PEUT-ÊTRE `',
                value: playerMaybe.length > 0 ? playerMaybe.map(player => `<@!${player.userId}>`).join('\n') : '\u200b',
                inline: true
            },
            {
                name: '<:x_:1137419292946727042> ` INDISPONIBLES `',
                value: playerNo.length > 0 ? playerNo.map(player => `<@!${player.userId}>`).join('\n') : '\u200b',
                inline: true
            }
        ])
}

function updatePastEventEmbed(event) {
    let title = `<:checkcircle:1137390611213865030> \` ${event.type.toUpperCase()} TERMINE \``
    let embedDescription = `<:calendar:1137424147056689293> \` DATE \` <t:${event.discordTimestamp}:F>\n`
    if (event.type !== 'review' && event.type !== 'team-building' && event.type !== 'tournament') {
        embedDescription += `<:arrowrightcircle:1137421115766083726> \` GAMES \` ${event.nbGames}\n`
    }
    if (event.trackerLink) {
        let trackerLinkDomain = event.trackerLink.split('/')[2]
        trackerLinkDomain = trackerLinkDomain.replace('www.', '')
        embedDescription += `\n<:link:1137424150764474388> \` TRACKER \` [${trackerLinkDomain.toUpperCase()}](${event.trackerLink})`
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
 * @param teamNotionPage}
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

async function cancelEvent(client, Team, eventID) {
    let event = Team.events.find(event => String(event._id) === eventID)
    if (!event) return "Event not found"

    // Send message to all event participants
    let eventParticipants = event.rsvps.map(rsvp => rsvp.userId)
    for (const participant of eventParticipants) {
        let user = await client.users.fetch(participant)
        let dmChannel = await user.createDM()
        dmChannel.send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`<:trash:1137390663797841991> L'événement ${event.name} qui débutait <t:${event.discordTimestamp}:R> a été annulé`)
                    .setColor("#2b2d31")
            ]
        })
    }

    let parentChannel = client.channels.cache.get(Team.linkedCategoryId)
    let organisationChannel = parentChannel.children.find(channel => channel.name.includes('organisation'))
    let staffChannel = parentChannel.children.find(channel => channel.name.includes('staff'))
    let messages = await organisationChannel.messages.fetch({ limit: 10 })
    let eventMessage = messages.find(message => message.id === event.messageId)

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
    cancelEvent
}