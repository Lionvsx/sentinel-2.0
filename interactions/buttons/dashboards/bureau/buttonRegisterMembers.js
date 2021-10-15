const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const User = require('../../../../src/schemas/UserSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

const {
    createButton,
    createButtonActionRow
} = require('../../../../utils/functions/messageComponents');
const { isMember } = require('../../../../utils/functions/dbFunctions')

module.exports = class RegisterAssoMembersButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonRegisterMembers', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)


        const dmChannel = await interaction.user.createDM()

        const userAudienceString = await userResponseContent(dmChannel, "Quels utilisateurs veux tu ajouter en tant que membre de LDV Esport? \`(liste de pseudos, séparées d'une virgule)\`").catch(err => console.log(err))
        if (!userAudienceString) return
        const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
        const userAudience = usersAndErrors[0];
        const userErrors = usersAndErrors[1];

        if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir ajouter les utilisateurs suivants en tant que **membre** ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure d'ajout des utilisateurs ...`)
        const registerResults = await registerUsers(userAudience, tempMsg, loading)

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération d'ajout de membres en tant que membres associatifs :\n*(Vous pouvez recopier les champs d'erreur pour les re-envoyer au bot lors d'une prochaine commande)*`)
            .addField('✅ UTILISATEURS AJOUTES', `\`\`\`${registerResults.success.length > 0 ? registerResults.success.join('\n'): 'Aucun'}\`\`\``, false)
            .addField('ℹ UTILISATEURS DEJA ENREGISTRES', `\`\`\`${registerResults.presence.length > 0 ? registerResults.presence.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`✉ UTILISATEURS INJOIGNABLES EN DM`, `\`\`\`${registerResults.errors.length > 0 ? registerResults.errors.join(',\n') : 'Aucun'}\`\`\``, false)
            .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
            .setColor('#fdcb6e')

        configLogger.setLogData(`ADDED USERS: \n${registerResults.success.length > 0 ? registerResults.success.join('\n'): 'Aucun'}\n\nCANT DM: \n${registerResults.errors.length > 0 ? registerResults.errors.join(',\n') : 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)
        
        dmChannel.send({
            embeds: [summaryEmbed]
        })
        configLogger.info(`<@!${interaction.user.id}> a ajouté \`${registerResults.success.length}\` utilisateur(s) en tant que membre LDV Esport :`)
    }
}


function registerUsers(audience, tempMsg, loading) {
    return new Promise(async (resolve) => {
        const success = []
        const errors = []
        const presence = []
        for (const member of audience) {
            const dmChannel = await member.createDM()
            
            const dBUser = await User.findOne({ discordId: member.user.id });
            if (isMember(dBUser)) {
                presence.push(member.user.tag)
                continue;
            }

            const componentRow = createButtonActionRow([
                createButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SUCCESS')
            ])
            const embed = new MessageEmbed()
                .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
                .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
                .setColor('#00b894')
            try {
                dmChannel.send({
                    embeds: [embed],
                    components: [componentRow]
                })
                if (dBUser && dBUser.id) {
                    dBUser.isMember = true;
                    await dBUser.save();
                } else {
                    await User.create({
                        username: member.user.username,
                        discordId: member.user.id,
                        userTag: member.user.tag,
                        avatarURL: member.user.displayAvatarURL(),
                        onServer: true,
                        isMember: true
                    })
                }
                success.push(member.user.tag)
                tempMsg.edit(`**${loading} | **Ajout des utilisateurs en cours à la DB : \`${success.length + errors.length}/${audience.length}\``)
            } catch (err) {
                errors.push(member.user.tag)
            }
        }
        if (success.length + errors.length === audience.length) {
            tempMsg.edit(`**✅ | **Ajout des utilisateurs terminé`)
            resolve({
                success: success,
                errors: errors
            })
        }
    })
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

