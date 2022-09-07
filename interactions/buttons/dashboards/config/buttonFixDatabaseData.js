const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions, MessageEmbed } = require('discord.js')
const { isMember } = require('../../../../utils/functions/dbFunctions')
const { askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const mongoose = require('mongoose')
const User = require('../../../../src/schemas/UserSchema')
const {
    createButtonActionRow,
    createButton
} = require('../../../../utils/functions/messageComponents')

module.exports = class FixDBDataButton extends BaseInteraction {
    constructor() {
        super('buttonFixDatabaseData', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        const loading = client.emojis.cache.get('741276138319380583')
    
        const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true });
        const dmChannel = await interaction.user.createDM();
        
        const noDataUsers = allUsers.filter(user => isMember(user) === false)
        const [userAudience, userErrors] = await getUsersFromDBArray(interaction.guild, noDataUsers);

        const confirmation = await askForConfirmation(dmChannel, `Êtes vous sûr de vouloir renvoyer le formulaire d'inscriptions aux utilisateurs suivants ?\n\nUSERS TROUVES:\n\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\`\nUSERS INTROUVABLES:\n\`\`\`${userErrors.length > 0 ? userErrors.join('\n') : 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

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
        configLogger.info(`<@!${interaction.user.id}> a renvoyé le formulaire d'enregistrement de membre à \`${registerResults.success.length}\` utilisateur(s)`)
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
                .setTitle(`**RAPPEL - BIENVENUE CHEZ LDV ESPORT**`)
                .setDescription(`Bonjour \`\`${member.user.username}\`\` !\nSi tu reçois ce message, c'est que tes données de membre de l'association \`\`LDV Esport\`\` ne sont pas complètes !\nAfin de finaliser ton inscription en tant que membre de LDV Esport, nous aurions besoin de quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
                .setColor('#00b894')
            try {
                await dmChannel.send({
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
                await tempMsg.edit(`**${loading} | **Ajout des utilisateurs en cours à la DB : \`${success.length + errors.length}/${audience.length}\``)
            } catch (err) {
                errors.push(member.user.tag)
            }
        }
        if (success.length + errors.length + presence.length === audience.length) {
            tempMsg.edit(`**✅ | **Ajout des utilisateurs terminé`)
            resolve({
                success: success,
                errors: errors,
                presence: presence
            })
        }
    })
}

const getUsersFromDBArray = (guild, dbArray) => {
    return new Promise(async (resolve) => {
        await updateGuildMemberCache(guild)
        const userArray = []
        const userFailArray = []
        for (const user of dbArray) {
            const userMatch = guild.members.cache.get(user.discordId)
            if (userMatch) userArray.push(userMatch)
            else userFailArray.push(user.userTag)
        }

        resolve([userArray, userFailArray])
    })
}