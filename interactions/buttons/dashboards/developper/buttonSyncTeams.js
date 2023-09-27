const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const {queryDatabase} = require("../../../../utils/functions/notionFunctions");
const Teams = require('../../../../src/schemas/TeamSchema')
const {updateGuildMemberCache} = require("../../../../utils/functions/utilitaryFunctions");
const {cleanTeams, updateTeamChannels, createTeamChannels, getTeamMembers,
    getTeamStaff
} = require("../../../../utils/functions/teamsFunctions");

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
                    linkedCategoryId: teamCategory.id,
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
                    if (!allTeamMembers.includes(member.id) && !member.roles.cache.has("1138459577734680577")) {
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

                dbTeam.game = team.properties["Jeu"]?.select?.name ?? undefined
                await dbTeam.save()

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



