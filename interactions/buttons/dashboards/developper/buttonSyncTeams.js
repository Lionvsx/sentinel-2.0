const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const {queryDatabase, getNotionPageById} = require("../../../../utils/functions/notionFunctions");
const Teams = require('../../../../src/schemas/TeamSchema')
const { MessageEmbed } = require("discord.js");
const {
    createButtonActionRow,
    createEmojiButton
} = require("../../../../utils/functions/messageComponents");
const {updateGuildMemberCache} = require("../../../../utils/functions/utilitaryFunctions");

module.exports = class ButtonSyncTeams extends BaseInteraction {
    constructor() {
        super('buttonSyncTeams', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const loading = client.emojis.cache.get('741276138319380583')
        await interaction.reply({
            content: `**${loading} | **Synchronisation des équipes en cours...`,
            ephemeral: true
        })

        const allTeams = await queryDatabase("4aa80d016d124eb991a8ba660e25a062")
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache

        for (const team of allTeams) {
            let teamId = team.id
            let teamEmoji = team.icon.emoji
            let teamName = team.properties["Nom d'équipe"].title[0].plain_text

            let dbTeam = await Teams.findOne({linkedNotionPageId: teamId})

            let [staffUsers, managers, coachs] = await getTeamStaff(team)
            let players = await getTeamMembers(team)

            if (!dbTeam) {
                let teamCategory = await interaction.guild.channels.create(`${teamEmoji} | ${teamName}`, {
                    type: 'GUILD_CATEGORY',
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ['VIEW_CHANNEL'],
                        }
                    ]
                })


                let teamRole = await interaction.guild.roles.create({
                    name: `${teamEmoji} | ${teamName}`,
                    color: '#50e1a9',
                    mentionable: true,
                    hoist: true,
                    position: interaction.guild.roles.cache.get("679423033844432917").position
                })

                await Teams.create({
                    linkedNotionPageId: teamId,
                    name: teamName,
                    emoji: teamEmoji,
                    game: team.properties["Jeu"]?.select?.name ?? undefined,
                    linkedRoleId: teamRole.id,
                    linkedCategoryId: teamCategory.id
                })

                let staffPermissions = [{
                    id: interaction.guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL']
                }]

                for (const staffUserId of staffUsers) {
                    let staffUser = await interaction.guild.members.fetch(staffUserId)
                    staffUser.roles.add(teamRole)
                    staffPermissions.push({
                        id: staffUserId,
                        allow: ['VIEW_CHANNEL']
                    })
                }



                for (const managerId of managers) {
                    let managerUser = await allMembers.get(managerId)
                    let rolesToAddManager = allRoles.filter(role => (role.id === "679423033844432917" || role.id === "622108209175593020" || role.id === "679422903346790411" || role.id === teamRole.id) && !managerUser.roles.cache.has(role.id))
                    managerUser.roles.add(rolesToAddManager)
                }

                for (const coachId of coachs) {
                    let coachUser = await allMembers.get(coachId)
                    let rolesToAddCoach = allRoles.filter(role => (role.id === "679423033844432917" || role.id === "622108099569909762" || role.id === "679422903346790411" || role.id === teamRole.id) && !coachUser.roles.cache.has(role.id))
                    coachUser.roles.add(rolesToAddCoach)
                }

                for (const playerId of players) {
                    let playerUser = await allMembers.get(playerId)
                    let rolesToAddPlayer = allRoles.filter(role => (role.id === "744234937535955045" || role.id === "679422903346790411" || role.id === teamRole.id) && !playerUser.roles.cache.has(role.id))
                    playerUser.roles.add(rolesToAddPlayer)
                }

                await createTeamChannels(interaction.guild, teamCategory, teamRole, staffPermissions)

                this.log("Created team " + teamName)

            } else {
                let teamCategory = interaction.guild.channels.cache.get(dbTeam.linkedCategoryId)
                let teamRole = interaction.guild.roles.cache.get(dbTeam.linkedRoleId)

                let allTeamMembers = players.concat(staffUsers)

                for (const [, member] of teamRole.members) {
                    if (!allTeamMembers.includes(member.id)) {
                        member.roles.remove(teamRole)
                    }
                }

                if (teamCategory.name !== `${teamEmoji} | ${teamName}`) {
                    await teamCategory.setName(`${teamEmoji} | ${teamName}`)
                }

                if (teamRole.name !== `${teamEmoji} | ${teamName}`) {
                    await teamRole.setName(`${teamEmoji} | ${teamName}`)
                }

                let staffPermissions = [{
                    id: interaction.guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL']
                }]

                for (const staffUserId of staffUsers) {
                    let staffUser = await allMembers.get(staffUserId)
                    staffUser.roles.add(teamRole)
                    staffPermissions.push({
                        id: staffUserId,
                        allow: ['VIEW_CHANNEL']
                    })
                }

                for (const managerId of managers) {
                    let managerUser = await allMembers.get(managerId)
                    let rolesToAddManager = allRoles.filter(role => (role.id === "679423033844432917" || role.id === "622108209175593020" || role.id === "679422903346790411" || role.id === teamRole.id) && !managerUser.roles.cache.has(role.id))
                    managerUser.roles.add(rolesToAddManager)
                }

                for (const coachId of coachs) {
                    let coachUser = await allMembers.get(coachId)
                    let rolesToAddCoach = allRoles.filter(role => (role.id === "679423033844432917" || role.id === "622108099569909762" || role.id === "679422903346790411" || role.id === teamRole.id) && !coachUser.roles.cache.has(role.id))
                    coachUser.roles.add(rolesToAddCoach)
                }

                for (const playerId of players) {
                    let playerUser = await allMembers.get(playerId)
                    let rolesToAddPlayer = allRoles.filter(role => (role.id === "744234937535955045" || role.id === "679422903346790411" || role.id === teamRole.id) && !playerUser.roles.cache.has(role.id))
                    playerUser.roles.add(rolesToAddPlayer)
                }

                await updateTeamChannels(interaction.guild, teamCategory, teamRole, staffPermissions)

                this.log("Updated team " + teamName)
            }
        }

        this.log("Cleaning teams...")
        await cleanTeams(interaction.guild)

        await interaction.editReply({
            content: `**<:check:1137390614296678421> | **Les équipes ont été synchronisées avec succès!`,
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
    await guild.channels.create(`🏆┃In Game`, {
        type: 'GUILD_VOICE',
        position: 7,
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
        parent: teamCategory,
        userLimit: 10
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

async function updateTeamChannels(guild, teamCategory, role, staffPermissions) {
    let childChannels = teamCategory.children
    let organisationChannel = childChannels.find(channel => channel.name === "📌┃organisation")
    let discussionChannel = childChannels.find(channel => channel.name === "💬┃discussion")
    let filesChannel = childChannels.find(channel => channel.name === "📒┃fichiers")
    let staffChannel = childChannels.find(channel => channel.name === "🔗┃staff")
    let dashboardChannel = childChannels.find(channel => channel.name === "🧭┃dashboard")
    let teamVocalChannel = childChannels.find(channel => channel.name === "🔊┃Team Vocal")
    let inGameChannel = childChannels.find(channel => channel.name === "🏆┃In Game")
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
    if (!inGameChannel) {
        await guild.channels.create(`🏆┃In Game`, {
            type: 'GUILD_VOICE',
            position: 7,
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
        await inGameChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
            VIEW_CHANNEL: false
        })
        await inGameChannel.permissionOverwrites.edit(role.id, {
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

async function sendTeamsDashboard(channel) {
    const DashBoardTeam = new MessageEmbed()
        .setColor('#2b2d31')
        .setTitle(`DASHBOARD TEAM`)
        .setThumbnail('https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png')
        .setDescription("Panneau de controle pour les managers afin de gérer son équipe. \nToutes les fonctionnalités sont expliquées ci-dessous:")
        .addFields(
            { name: '▶️ | START CALL', value: 'Démarrer l\'appel', inline: true },
            { name: '⏹️ | END CALL', value: "Clôturer l'appel", inline: true },
            { name: '🔄 | UPDATE TEAM PERMS', value: "Met à jour les permissions de vos salons", inline: true },
        )
    const Row1 = createButtonActionRow([
        createEmojiButton(`buttonStartCall|${channel.parent.id}`, 'Démarrer l\'appel', 'SECONDARY', '▶️'),
        createEmojiButton(`buttonEndCall|${channel.parent.id}`, 'Arrêter l\'appel', 'SECONDARY', '⏹️'),
        createEmojiButton('buttonUpdateTeam', 'Mettre à jour les permissions', 'SECONDARY', '🔄'),
    ])
    channel.send({
        embeds: [DashBoardTeam],
        components: [Row1]
    })
}