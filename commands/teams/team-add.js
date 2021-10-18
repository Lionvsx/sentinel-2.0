const BaseCommand = require('../../utils/structures/BaseCommand')
const Team = require('../../src/schemas/TeamSchema');
const User = require('../../src/schemas/UserSchema');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');

const DiscordLogger = require('../../utils/services/discordLoggerService');
const { isMember } = require('../../utils/functions/dbFunctions');

module.exports = class TeamInfoCommand extends BaseCommand {
    constructor() {
        super('team-add', 'teams', [], {
            usage: "team-add <user> <team>",
            description: 'Ajoute un utilisateur à une équipe',
            categoryDisplayName: `👥 Teams`,
            userPermissions: [],
            clientPermissions: [],
            examples: ["team-add Ominga Orion|Ajoute l'utilisateur Ominga à l'équipe LDV Orion."],
            serverOnly: true,
            admin: true,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {
        let guild = message.guild
        let allMembers = await updateGuildMemberCache(guild);
        let allRoles = guild.roles.cache

        const teamLogger = new DiscordLogger('teams', '#0984e3')
        teamLogger.setLogMember(message.member)
        teamLogger.setGuild(message.guild)

        if (args[2]) {
            let selectedMember = undefined
            if (args[1] === 'add') {
                selectedMember = allMembers.find(m => m.user.tag.toLowerCase().includes(args[2].toLowerCase()))
                args.splice(0, 3)
            } else {
                selectedMember = allMembers.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()))
                args.splice(0, 2)
            }
            let stringRole = args.join(' ')
            const existingTeam = await Team.findOne({ name: {$regex: stringRole.toUpperCase()} })
            if (existingTeam) {
                const user = await User.findOne({ discordId: selectedMember.id });
                if (!user && !user.id) {
                    teamLogger.error(`Corruption de la base de données pour \`${selectedMember.user.tag}\` => veuillez la re-synchroniser !`)
                    message.channel.send(`**:x: | **Joueur introuvable !`)
                } else if (!isMember(user)) {
                    teamLogger.error(`Le joueur \`${user.userTag}\` a le rôle membre mais n'es pas enregistré en tant que membre !`)
                    message.channel.send(`**:x: | **Le joueur n'est pas membre !`)
                } else {
                    const rolesToAdd = allRoles.filter(role => (role.id === '679422903346790411' || role.id === '744234937535955045' || role.id === '744234676088209449' || role.id === existingTeam.linkedRoleId) && !selectedMember.roles.cache.has(role.id))
                    try {
                        await selectedMember.roles.add(rolesToAdd)
                        user.role = `joueur|${existingTeam.game}|${existingTeam._id}`
                        await user.save()
                        teamLogger.info(`Nouveau profil de joueur pour <@!${User.discordId}>\n\`${rolesToAdd.size}\` role(s) ajouté(s) !`)
                    } catch (err) {
                        console.log(err)
                        teamLogger.warning(`Erreur lors de la création d'un profil de joueur pour <@!${user.discordId}>`)
                    }
                    message.channel.send(`**:white_check_mark: | **Vous avez ajouté le joueur \`${selectedMember.user.username}\` à l'équipe \`${existingTeam.name}\``)
                    teamLogger.info(`<@!${message.author.id}> a ajouté \`${selectedMember.user.username}\` à l'équipe \`${existingTeam.name}\``)
                }
            } else {
                message.channel.send(`**:x: | **Équipe introuvable !`)
            }

        } else {
            message.channel.send(`**:x: | **Veuillez renseigner des arguments valides \`(team-add <user> <team>)\``)
        }
    }
}