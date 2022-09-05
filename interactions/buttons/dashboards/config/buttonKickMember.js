const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const User = require('../../../../src/schemas/UserSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

const {
    createButton,
    createMessageActionRow
} = require('../../../../utils/functions/messageComponents');
const { isMember } = require('../../../../utils/functions/dbFunctions')

module.exports = class KickMember extends BaseInteraction {
    constructor() {
        super('buttonKickMember', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const dmChannel = await interaction.user.createDM()
        await interaction.deferUpdate()


        const userAudienceString = await userResponseContent(dmChannel, "Quels utilisateurs voulez supprimer de la DB des membres de LDV Esport? \`(liste de pseudos, séparées d'une virgule)\`").catch(err => console.log(err))
        if (!userAudienceString) return
        const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
        const userAudience = usersAndErrors[0];
        const userErrors = usersAndErrors[1];

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir retirer le statut de **membre** des utilisateurs suivants ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure ...`)

        const kickResults = await kickMembers(client, userAudience, tempMsg, loading, interaction.guild.roles.cache)

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération :\n*(Vous pouvez recopier les champs d'erreur pour les re-envoyer au bot lors d'une prochaine commande)*`)
            .addField('✅ UTILISATEURS RADIES', `\`\`\`${kickResults.success.length > 0 ? kickResults.success.join('\n'): 'Aucun'}\`\`\``, false)
            .addField('ℹ UTILISATEURS NON MEMBRES', `\`\`\`${kickResults.nonMembers.length > 0 ? kickResults.nonMembers.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`✉ UTILISATEURS INJOIGNABLES EN DM`, `\`\`\`${kickResults.errors.length > 0 ? kickResults.errors.join(',\n') : 'Aucun'}\`\`\``, false)
            .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
            .setColor('#fdcb6e')

        configLogger.setLogData(`KICKED USERS: \n${kickResults.success.length > 0 ? kickResults.success.join('\n'): 'Aucun'}\n\nCANT DM: \n${kickResults.errors.length > 0 ? kickResults.errors.join(',\n') : 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)
        
        dmChannel.send({
            embeds: [summaryEmbed]
        })
        configLogger.info(`<@!${interaction.user.id}> a retiré \`${kickResults.success.length}\` utilisateur(s) de la DB des membres LDV :`)
    }
}

const getUsersAndErrorsFromString = (guild, searchArgs) => {
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

function kickMembers(client, audience, tempMsg, loading, allRoles) {
    return new Promise(async (resolve) => {
        const success = []
        const errors = []
        const nonMembers = []
        for (const member of audience) {
            const dmChannel = await member.createDM()
            
            const dBUser = await User.findOne({ discordId: member.user.id });
            if (dBUser.isMember) {
                const embed = new MessageEmbed()
                    .setTitle(`**MISE A JOUR DE VOTRE STATUT**`)
                    .setDescription(`Votre statut en tant que membre de LDV Esport a été modifié : vous avez été retiré de la base de données des membres de LDV Esport\nSi vous pensez que cela est une erreur, merci d'ouvrir un ticket par le biais du bouton ci dessous`)
                    .setColor('#e67e22')
                try {
                    await dmChannel.send({
                        embeds: [embed],
                        components: [createMessageActionRow([
                            createButton('buttonTicketRequestBureau', 'Ouvrir un ticket', 'DANGER')
                        ])]
                    })
                    let roles = member.roles
        
                    let rolesToRemove = roles.cache.filter(role => role.rawPosition < allRoles.get('742810872044322918').rawPosition && role.rawPosition > allRoles.get('624713487112732673').rawPosition || role.rawPosition < allRoles.get('676798588034220052').rawPosition && role.rawPosition > allRoles.get('677220059575222282').rawPosition || role.id === '744234761282650213')
        
                    dBUser.isMember = false
                    dBUser.isResponsable = false
                    dBUser.role = undefined
                    dBUser.roleResponsable = undefined
                    await dBUser.save();
                    client.allUsers.delete(member.user.id)
                    console.log(`${member.user.username} => DB Config Nuked!`)

        
                    if (rolesToRemove.size > 0) {
                        await member.roles.remove(rolesToRemove)
                        console.log(`${member.user.username} => ${rolesToRemove.size} roles removed !`)
                    }

                    success.push(member.user.tag)
                    await tempMsg.edit(`**${loading} | **Retrait des utilisateurs en cours de la DB : \`${success.length + errors.length + nonMembers.length}/${audience.length}\``)
                } catch (err) {
                    console.log(err)
                    errors.push(member.user.tag)
                }
            } else {
                nonMembers.push(member.user.tag)
            }
            
        }
        if (success.length + errors.length + nonMembers.length === audience.length) {
            tempMsg.edit(`**✅ | **Modification de la configuration des utilisateurs terminée`)
            resolve({
                success: success,
                errors: errors,
                nonMembers: nonMembers
            })
        }
    })
}