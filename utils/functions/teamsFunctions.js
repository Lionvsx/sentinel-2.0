const Teams = require("../../src/schemas/TeamSchema");
const {getNotionPageById} = require("./notionFunctions");
const {MessageEmbed, TextChannel} = require("discord.js");
const {
    createButtonActionRow,
    createEmojiButton
} = require("./messageComponents");

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
        .setTitle(`<:activity:1137390592314331176> \` SMART MANAGER \``)
        .setThumbnail('https://cdn.discordapp.com/attachments/1134540725816664177/1138453394915328010/cpu.png')
        .setDescription(`\n<:toggleleft:1138440738649149472> \` STATUS : OFF\``)
        .addFields(
            { name: '\u200B', value: '\u200B' },
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

    let embedDescription = smState ? "<:toggleright:1138440735230804018> \` STATUS : ON\`" : "<:toggleleft:1138440738649149472> \` STATUS : OFF\`"

    const DashboardTeam = new MessageEmbed()
        .setColor('#2b2d31')
        .setTitle(`<:activity:1137390592314331176> \` SMART MANAGER \``)
        .setDescription(embedDescription + "\n")
        .addFields(
            { name: '<:pluscircle:1137390650690650172> | ` CREATE CHANNEL `', value: "Crée un salon", inline: false },
            { name: '<:minuscircle:1137390648262135951> | ` DELETE CHANNEL `', value: "Supprime un salon", inline: false },
            { name: '<:userplus:1137394694972788837> | ` ADD SUB `', value: 'Donne des accès temporaires à l\'équipe', inline: false },
            { name: '<:userminus:1137394849025359992> | ` REMOVE SUB `', value: 'Retire des accès temporaires à l\'équipe', inline: false },
            { name: '<:settings:1137410884432564404> | ` SMART MANAGER `', value: "Reconfigure le smart manager", inline: false },
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

module.exports = {
    getTeamStaff,
    getTeamMembers,
    sendTeamsDashboard,
    createTeamChannels,
    updateTeamChannels,
    cleanTeams,
    updateTeamsDashboard
}