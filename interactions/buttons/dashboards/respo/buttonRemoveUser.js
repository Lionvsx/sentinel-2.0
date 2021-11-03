const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const mongoose = require('mongoose')
const { updateGuildMemberCache } = require("../../../../utils/functions/utilitaryFunctions")
const DiscordLogger = require('../../../../utils/services/discordLoggerService')

const poleIds = {
    webtv : "622108579792683010",
    da :  "622108762416611329",
    com :  "622109740637487130",
    event : "622109829150015498",
    esport : "624715536693198888",
    partenariat : "894735081254551583"
}
module.exports = class RemoveUserButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonRemoveUser', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        const dmChannel = await interaction.user.createDM()
        const allRoles = interaction.guild.roles.cache

        const userDB = await mongoose.model('User').findOne({ onServer: true, discordId: interaction.user.id })
        
        if (!userDB.roleResponsable) {
            interaction.reply({
                content: `**❌ | **Vous n'êtes pas responsable dans la base de données !`,
                ephemeral: true
            })
            return
        }
        
        interaction.deferUpdate()

        // REDONDANT AVEC ADD MEMBER, ON PEUT FAIRE UNE FONCTION UTILS
        const userAudienceString = await userResponseContent(dmChannel, `Quels utilisateurs veux tu retirer de la catégorie ${userDB.roleResponsable}? \`(liste de pseudos, séparées d'une virgule)\``).catch(err => console.log(err))
        if (!userAudienceString) return
        const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
        const userAudience = usersAndErrors[0];
        const userErrors = usersAndErrors[1];

        if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir retirer ces utilisateurs de **votre pôle** ${userDB.roleResponsable} ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return dmChannel.send(`**❌ | **Commande annulée !`)

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure de retrait des utilisateurs ...`)
        const staffResults = await staffUsers(userAudience, tempMsg, loading, userDB.roleResponsable, allRoles)
        await tempMsg.delete()

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération d'ajout de membres en tant que membres associatifs :\n*(Vous pouvez recopier les champs d'erreur pour les renvoyer au bot lors d'une prochaine commande)*`)
            .addField('✅ UTILISATEURS RETIRES', `\`\`\`${staffResults.length > 0 ? staffResults.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
            .addField(`ℹ️ ROLES RESTANTS`, `Pensez à retirer les rôles sous-pôle ainsi que le divider \`---SOUS POLES---\` des utilisateurs retirés.`, false)
            .setColor('#fdcb6e')

        configLogger.setLogData(`REMOVED USERS TO ${userDB.roleResponsable.toUpperCase()}: \n${staffResults.length > 0 ? staffResults.join('\n'): 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)

        dmChannel.send({
            embeds: [summaryEmbed]
        })
        //CHANGE DB USER
        configLogger.info(`<@!${interaction.user.id}> a retiré \`${staffResults.length}\` utilisateur(s) dans la catégorie ${userDB.roleResponsable} :`)
    }
}

function getUsersAndErrorsFromString(guild, searchArgs) { // REDONDANCE AVEC REGISTER MEMBER
    return new Promise(async (resolve) => {
        await updateGuildMemberCache(guild)
        const userArray = []
        const userFailArray = []
        for (const arg of searchArgs) {
            const userMatch = guild.members.cache.find(m => m.user.tag.toLowerCase().includes(arg.toLowerCase()))
            if (userMatch) userArray.push(userMatch)
            else userFailArray.push(arg)
        }

        resolve([userArray, userFailArray])
    })
}

function staffUsers(audience, tempMsg, loading, category, allRoles) {
    return new Promise(async (resolve) => {
        const success = []
        for (const member of audience) {
            const userDB = await mongoose.model('User').findOne({ discordId: member.user.id });
            // Override DB
            userDB.role = userDB.role === category ? undefined : userDB.role;
            userDB.save();
            // Check dividers role
            let rolesToRemove
            if (isMultiplePole(member)) {
                rolesToRemove = allRoles.filter(role => role.id === poleIds[category] && member.roles.cache.has(role.id))
            } else {
                rolesToRemove = allRoles.filter(role => (role.id === '742006587597651990' || role.id === poleIds[category]) && member.roles.cache.has(role.id))
            }
            // Add pole role
            await member.roles.remove(rolesToRemove)

            success.push(member.user.tag)
            await tempMsg.edit(`**${loading} | **Retrait des utilisateurs en cours dans la DB : \`${success.length}/${audience.length}\``)
        }
        if (success.length === audience.length) {
            await tempMsg.edit(`**✅ | **Retrait des utilisateurs terminé`)
            resolve(success)
        }
    })
}

function isMultiplePole(user) {
    return user.roles.cache.filter(r => r.id === poleIds.webtv || r.id === poleIds.com || r.id === poleIds.da || r.id === poleIds.event || r.id === poleIds.esport || r.id === poleIds.partenariat).size > 1;
}