const { Permissions, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const { askForConfirmation, userResponseContent } = require('../../utils/functions/awaitFunctions');
const { getEmoji, updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');
const BaseCommand = require('../../utils/structures/BaseCommand')
const Team = require('../../src/schemas/TeamSchema')
const DiscordLogger = require('../../utils/services/discordLoggerService');
const { isMember } = require('../../utils/functions/dbFunctions');

module.exports = class TeamSetCommand extends BaseCommand {
    constructor() {
        super('team-set', 'teams', [], {
            usage: 'team-set',
            description: 'Initialise une équipe',
            categoryDisplayName: `👥 Teams`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {

        const existingTeam = await Team.findOne({ linkedCategoryId: message.channel.parentId })
        if (existingTeam && existingTeam._id) return message.channel.send(`**❌ | **Ce channel héberge déja une équipe : \`${existingTeam.name}\`, utilisez \`team delete\` pour la supprimer !`)

        const categoryChannel = message.channel.parent

        const channelArgs = categoryChannel?.name.split('|')

        const teamEmoji = getEmoji(channelArgs[0])

        const loading = client.emojis.cache.get('741276138319380583')

        if (!teamEmoji || getEmoji(channelArgs[1])) return message.channel.send(`**❌ | **Je n'arrive pas à détecter une catégorie d'équipe ! \`\`(le format de la catégorie doit être <emoji> | <nom d'équipe>)\`\``)

        const teamLogger = new DiscordLogger('teams', '#0984e3')
        teamLogger.setGuild(message.guild)
        teamLogger.setLogMember(message.member)

        const allRoles = message.guild.roles.cache
        const allMembers = await updateGuildMemberCache(message.guild)

        const linkedRole = allRoles.find(role => role.name.toLowerCase().includes(channelArgs[1].toLowerCase().trim()))

        const staffMembers = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '624715536693198888', '744234761282650213'))
        const players = allMembers.filter(member => member.roles.cache.hasAll(linkedRole.id, '744234761282650213') && !member.roles.cache.has('624715536693198888'))

        
        const confirmation = await askForConfirmation(message.channel, `✅ Informations d'équipe détectées :\nVoulez vous initialiser une équipe avec ces informations ?\n\`\`\`\nNOM D'EQUIPE: ${channelArgs[1].toUpperCase().trim()}\nEMOJI: ${teamEmoji}\nROLE: @${linkedRole.name}\nCATEGORIE: #${categoryChannel.name}\n\nSTAFFS:\n${staffMembers?.size > 0 ? staffMembers.map(m => m.user.tag).join('\n') : 'Aucun'}\n\nJOUEURS:\n${players.size > 0 ? players.map(m => m.user.tag).join('\n') : 'Aucun'} \`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

        const teamGame = await userResponseContent(message.channel, `Veuillez spécifier le jeu de cette équipe :`).catch(err => console.log(err))
        if (!teamGame) return;

        const tempMsg = await message.channel.send(`**${loading} | **Création de l'équipe en cours...`)

        const newTeam = await Team.create({
            linkedRoleId: linkedRole.id,
            linkedCategoryId: categoryChannel.id,
            emoji: teamEmoji ? teamEmoji : undefined,
            game: teamGame ? teamGame.toUpperCase() : undefined,
            name: channelArgs[1].toUpperCase().trim()
        })

        for (const [userId, player] of players) {
            const User = await mongoose.model('User').findOne({ discordId: userId });
            if (!User && !User.id) {
                teamLogger.error(`Corruption de la base de données pour \`${player.user.tag}\` => veuillez la re-synchroniser !`)
                continue;
            }
            if (!isMember(User)) {
                teamLogger.error(`Le joueur \`${User.userTag}\` a le rôle membre mais n'es pas enregistré en tant que membre !`)
                continue;
            }
            const guildMember = allMembers.get(userId)
            const rolesToAdd = allRoles.filter(role => (role.id === '679422903346790411' || role.id === '744234937535955045' || role.id === '744234676088209449') && !guildMember.roles.cache.has(role.id))
            try {
                await guildMember.roles.add(rolesToAdd)
                User.role = `joueur|${teamGame}|${newTeam._id}`
                await User.save()
                teamLogger.info(`Nouveau profil de joueur pour <@!${User.discordId}>\n\`${rolesToAdd.size}\` role(s) ajouté(s) !`)
            } catch (err) {
                console.log(err)
                teamLogger.warning(`Erreur lors de la création d'un profil de joueur pour <@!${User.discordId}>`)
            }
            
        }
        const embed = new MessageEmbed()
            .setDescription(`Informations : \n\`\`\`\nNOM D'EQUIPE: ${channelArgs[1].toUpperCase().trim()}\nEMOJI: ${teamEmoji}\nROLE: @${linkedRole.name}\nCATEGORIE: #${categoryChannel.name}\n\nSTAFFS:\n${staffMembers?.size > 0 ? staffMembers.map(m => m.user.tag).join('\n') : 'Aucun'}\n\nJOUEURS:\n${players.size > 0 ? players.map(m => m.user.tag).join('\n') : 'Aucun'}\`\`\``)
            .setColor('#2ecc71')
        tempMsg.edit({
            content: `**✅ | **L'équipe a été crée avec succès`,
            embeds: [embed]
        })
        
        teamLogger.setLogData(`NOM D'EQUIPE: ${channelArgs[1].toUpperCase().trim()}\nEMOJI: ${teamEmoji}\nROLE: @${linkedRole.name}\nCATEGORIE: #${categoryChannel.name}\n\nSTAFFS:\n${staffMembers?.size > 0 ? staffMembers.map(m => m.user.tag).join('\n') : 'Aucun'}\n\nJOUEURS:\n${players.size > 0 ? players.map(m => m.user.tag).join('\n') : 'Aucun'}`)
        teamLogger.info(`<@!${message.author.id}> a enregistré une nouvelle équipe dans la base de données :`)
    }
}