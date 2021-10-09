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

module.exports = class AddUserButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonAddUser', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        const dmChannel = await interaction.user.createDM()
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache

        let userRequest = allMembers.find(m => m.user.tag.toLowerCase().includes(interaction.user.username.toLowerCase()));

        if (!userRequest) {
            interaction.reply({
                content: `**❌ | **INTERNAL SERVER ERROR : CLAIMANT CORRUPTION`,
                ephemeral: true
            })
            return
        }

        const userDB = await mongoose.model('User').findOne({ onServer: true, discordId: userRequest.id })
        
        if (!userDB.roleResponsable) {
            interaction.reply({
                content: `**❌ | **Vous n'êtes pas responsable dans la base de données !`,
                ephemeral: true
            })
            return
        }
        
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })

        // REDONDANT AVEC ADD MEMBER, ON PEUT FAIRE UNE FONCTION UTILS
        const userAudienceString = await userResponseContent(dmChannel, `Quels utilisateurs veux tu ajouter à la catégorie ${userDB.roleResponsable}? \`(liste de pseudos, séparées d'une virgule)\``).catch(err => console.log(err))
        if (!userAudienceString) return
        const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
        const userAudience = usersAndErrors[0];
        const userErrors = usersAndErrors[1];

        if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir ajouter les utilisateurs suivants dans **votre pôle** ${userDB.roleResponsable} ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return dmChannel.send(`**❌ | **Commande annulée !`)

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure d'ajout des utilisateurs ...`)
        const staffResults = await staffUsers(userAudience, tempMsg, loading, userDB.roleResponsable, allRoles)
        await tempMsg.delete()

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération d'ajout de membres en tant que membres associatifs :\n*(Vous pouvez recopier les champs d'erreur pour les renvoyer au bot lors d'une prochaine commande)*`)
            .addField('✅ UTILISATEURS AJOUTES', `\`\`\`${staffResults.length > 0 ? staffResults.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
            .setColor('#fdcb6e')

        configLogger.setLogData(`ADDED USERS TO ${userDB.roleResponsable.toUpperCase()}: \n${staffResults.length > 0 ? staffResults.join('\n'): 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)

        dmChannel.send({
            embeds: [summaryEmbed]
        })
        configLogger.info(`<@!${interaction.user.id}> a ajouté \`${staffResults.length}\` utilisateur(s) dans la catégorie ${userDB.roleResponsable} :`)
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
            userDB.role = category;
            userDB.save();
            // Check dividers role
            const rolesToAdd = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[category]) && !member.roles.cache.has(role.id))
            // Add pole role
            await member.roles.add(rolesToAdd)

            success.push(member.user.tag)
            await tempMsg.edit(`**${loading} | **Ajout des utilisateurs en cours à la DB : \`${success.length}/${audience.length}\``)
        }
        if (success.length === audience.length) {
            await tempMsg.edit(`**✅ | **Ajout des utilisateurs terminé`)
            resolve(success)
        }
    })
}