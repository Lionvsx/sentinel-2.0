const BaseInteraction = require("../../../../utils/structures/BaseInteraction");
const { MessageEmbed } = require("discord.js");
const Teams = require("../../../../src/schemas/TeamSchema");

module.exports = class ButtonUpdateTeam extends BaseInteraction {
    constructor() {
        super("buttonUpdateTeam", "teams", "button", {
        userPermissions: [],
        clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `L'équipe a été mise à jour !`,
        })

        let dbTeam = await Teams.findOne({linkedCategoryId: interaction.channel.parent.id})

        let teamId = team.id
        let teamEmoji = team.icon.emoji
        let teamName = team.properties["Nom d'équipe"].title[0].plain_text


        let [staffUsers, managers, coachs] = await getTeamStaff(team)
        let players = await getTeamMembers(team)

        let teamCategory = interaction.guild.channels.cache.get(dbTeam.linkedCategoryId)
        let teamRole = interaction.guild.roles.cache.get(dbTeam.linkedRoleId)

        let allTeamMembers = players.concat(staffUsers)

        for (const [key, member] of teamRole.members) {
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