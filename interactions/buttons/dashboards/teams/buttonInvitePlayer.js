const Team = require('../../../../src/schemas/TeamSchema')
const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const { updateGuildMemberCache } = require("../../../../utils/functions/utilitaryFunctions")
const DiscordLogger = require('../../../../utils/services/discordLoggerService')

module.exports = class buttonInvitePlayer extends BaseInteraction {
    constructor() {
        super('buttonInvitePlayer', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        interaction.reply({
            content: `Check tes DMs !`,
            ephemeral: true
        })
        
        const selectedOptionArgs = interaction.values[0].split('|')
        const cmd = selectedOptionArgs[0]
        if (!cmd) return

        const teamId = selectedOptionArgs[1]
        const team = await Team.find({ _id: teamId })

        const dmChannel = await interaction.user.createDM()

        // REDONDANT AVEC ADD MEMBER, ON PEUT FAIRE UNE FONCTION UTILS
        const userAudienceString = await userResponseContent(dmChannel, `Quels utilisateurs veux tu inviter à l'équipe ${team.name}? \`(liste de pseudos, séparées d'une virgule)\``).catch(err => console.log(err))
        if (!userAudienceString) return

        const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
        const userAudience = usersAndErrors[0];
        const userErrors = usersAndErrors[1];

        if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir inviter les utilisateurs suivants dans **l'équipe** ${team.name} ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return dmChannel.send(`**❌ | **Commande annulée !`)

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure...`)
        const allRoles = interaction.guild.roles.cache
        const invitResult = await inviteUsers(userAudience, tempMsg, loading, team, allRoles)
        await tempMsg.delete()

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération d'invitation des joueurs à votre équipe :\n*(Vous pouvez recopier les champs d'erreur pour les renvoyer au bot lors d'une prochaine commande)*`)
            .addField('✅ UTILISATEURS AJOUTES', `\`\`\`${invitResult.length > 0 ? invitResult.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
            .setColor('#fdcb6e')

        configLogger.setLogData(`INVITED USERS TO ${team.name}: \n${invitResult.length > 0 ? invitResult.join('\n'): 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)

        dmChannel.send({
            embeds: [summaryEmbed]
        })

        configLogger.info(`<@!${interaction.user.id}> a invité \`${invitResult.length}\` utilisateur(s) dans l'équipe ${team.name} :`)
    }
}

function getUsersAndErrorsFromString(guild, searchArgs) { // REDONDANCE AVEC REGISTER MEMBER
    return new Promise(async (resolve) => {
        const guildMembers = await updateGuildMemberCache(guild)
        const userArray = []
        const userFailArray = []
        for (const arg of searchArgs) {
            const userMatch = guildMembers.find(m => m.user.tag.toLowerCase().includes(arg.toLowerCase()))
            if (userMatch) userArray.push(userMatch)
            else userFailArray.push(arg)
        }
        resolve([userArray, userFailArray])
    })
}

function inviteUsers(audience, tempMsg, loading, team, allRoles) {
    return new Promise(async (resolve) => {
        const success = []
        for (const member of audience) {
            const rolesToAdd = allRoles.filter(role => (role.id === '631399495711588373' || role.id === '679422903346790411' || role.id === team.linkedRoleId) && !member.roles.cache.has(role.id))
            await member.roles.add(rolesToAdd)

            success.push(member.user.tag)
            await tempMsg.edit(`**${loading} | **Invitation des joueurs en cours : \`${success.length}/${audience.length}\``)
        }
        if (success.length === audience.length) {
            await tempMsg.edit(`**✅ | **Ajout des utilisateurs terminé`)
            resolve(success)
        }
    })
}