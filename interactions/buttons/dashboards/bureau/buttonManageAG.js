const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation, userResponseContent } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const { createButton, createButtonActionRow } = require('../../../../utils/functions/messageComponents')
const Presence = require('../../../../src/schemas/PresenceSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')

module.exports = class StartAgButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonManageAG', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()

        const loading = client.emojis.cache.get('741276138319380583')

        const agLogger = new DiscordLogger('AG', '#ff6b6b')
        agLogger.setLogMember(interaction.member)
        agLogger.setGuild(interaction.guild)
        
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allAssoMembers = await mongoose.model('User').find({ onServer: true, isMember: true })
        const dmChannel = await interaction.user.createDM().catch(err => console.log(err))
        const existingAG = await mongoose.model('Presence').findOne({ running: true, type: 'AG'})
        if (existingAG && existingAG._id) {
            const selectionEmbed = new MessageEmbed()
            .setDescription(`Bonjour \`${interaction.user.username}\`\nUne AG est actuellement en cours : \`${existingAG.name}\`\n\`${existingAG.name}\` est prévue pour \`${existingAG.date}\`\nVoulez vous?`)
            .addFields(
                { name: `🙋‍♂️ ${existingAG.open ? "Fermer l'appel" : "Ouvrir l'appel"}`, value: `L'appel est actuellement \`${existingAG.open ? "OUVERT" : "FERME"}\``, inline: true },
                { name: `📨 Forcer présence`, value: `Marque un ou plusieurs utilisateurs comme présent à l'AG, qu'ils soient membres ou pas`, inline: true },
                { name: '🗑 Cloturez l\'AG', value: "Cloture l'AG et ferme l'appel. L'appel ne pourra pas etre réouvert !", inline: true },
                { name: '❌ Annuler la commande', value: "Termine l'interaction avec le bot", inline: true },
            )
            .setColor('#9b59b6')
            const reactionSelector = await reactionEmbedSelector(dmChannel, ['🙋‍♂️', '📨', '🗑', '❌'], selectionEmbed).catch(err => console.log(err))
            if (!reactionSelector) return;
    
            if (reactionSelector.customId === '🙋‍♂️') {
                selectorReply(reactionSelector, '🙋‍♂️', `${existingAG.open ? "Fermer l'appel" : "Ouvrir l'appel"}`)
                if (existingAG.open === false ) {
                    existingAG.open = true;
                    await existingAG.save()
                    dmChannel.send(`**✅ | **L'appel a été \`ouvert\` !`)
                    agLogger.info(`<@!${interaction.user.id}> a ouvert l'appel pour l'AG : \`${existingAG.name}\``)
                } else {
                    existingAG.open = false;
                    await existingAG.save()
                    dmChannel.send(`**✅ | **L'appel a été \`fermé\` !`)
                    agLogger.info(`<@!${interaction.user.id}> a fermé l'appel pour l'AG : \`${existingAG.name}\``)
                }
                
            } else if (reactionSelector.customId === '🗑') {
                selectorReply(reactionSelector, '🗑', `Clôturer l'AG`)
                existingAG.running = false
                existingAG.open = false
                await existingAG.save()


                dmChannel.send(`**✅ | **L'AG a été cloturée !`)
                agLogger.info(`<@!${interaction.user.id}> a cloturé l'appel pour l'AG : \`${existingAG.name}\``)

                const memberCheck = existingAG.memberCheck;
                const memberAudience = existingAG.audience;
            } else if(reactionSelector.customId === '📨') {
                selectorReply(reactionSelector, '📨', `Forcer présence`)
                const userAudienceString = await userResponseContent(dmChannel, `Quel(s) utilisateur(s) veux tu marquer comme présent(s)? \`(liste de pseudos, séparées d'une virgule)\``).catch(err => console.log(err))
                if (!userAudienceString) return
                const usersAndErrors = await getUsersAndErrorsFromString(interaction.guild, userAudienceString.split(/\s*[,]\s*/))
                const userAudience = usersAndErrors[0];
                const userErrors = usersAndErrors[1];
                if (userAudience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur trouvé !`)

                const tempMsg = await dmChannel.send(`**${loading} | **Début de la procédure d'ajout des utilisateurs ...`)
                const summaryEmbed = new MessageEmbed()
                    .setTitle('COMPTE RENDU')
                    .setDescription(`Compte rendu final de l'opération`)
                    .addField('✅ UTILISATEURS AJOUTES', `\`\`\`${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\`\`\``, false)
                    .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
                    .setColor('#fdcb6e')
        
                agLogger.setLogData(`SUCCESS:\n${userAudience.length > 0 ? userAudience.map(member => member.user.tag).join('\n'): 'Aucun'}\n\nNOT ON SERVER: \n${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}`)
                for (const member of userAudience) {
                    const User = await mongoose.model('User').findOne({ discordId: member.user.id })
                    mongoose.model('Presence').updateOne( { _id: existingAG._id }, { $push: {memberCheck: User}}, {}, async (err, result) => {
                        if (err) throw err;
                    })
                }
                await tempMsg.delete()
                dmChannel.send({
                    embeds: [summaryEmbed]
                })
                agLogger.info(`<@!${interaction.user.id}> a marqué des membres comme présents à l'AG : \`${existingAG.name}\``)
            } else {
                selectorReply(reactionSelector, '❌', `Commande annulée`)
            }
        } else {
            
            const selectionEmbed = new MessageEmbed()
                .setDescription(`Bonjour \`${interaction.user.username}\`\nComment se déroulera l'assemblée générale? `)
                .addFields(
                    { name: '🌐 En ligne', value: "Crée une AG en ligne et envoie une invitation à tous les membres", inline: true },
                    { name: '👥 En présentiel', value: "Envoie une invitation pour une AG en présentiel à tous les membres", inline: true },
                    { name: '❌ Annuler la commande', value: "Termine l'interaction avec le bot", inline: true },
                )
                .setColor('#9b59b6')
    
            const reactionSelector = await reactionEmbedSelector(dmChannel, ['🌐', '👥', '❌'], selectionEmbed).catch(err => console.log(err))
            if (!reactionSelector) return;
    
            if (reactionSelector.customId === '🌐') {
                selectorReply(reactionSelector, '🌐', `En ligne`)
                return dmChannel.send('EN DEV (WIP)')
                const date = await userResponseContent(dmChannel, `A quelle date et heure se tiendra votre AG?`).catch(err => console.log(err))
                if (!date) return;
                const customName = await userResponseContent(dmChannel, `Quel est le nom de cette assemblée générale? \`(exemple: AG de début d'année)\``).catch(err => console.log(err))
                if (!customName) return;

                const confirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir créer une AG en ligne?`)
                if (!confirmation) return;
            } else if (reactionSelector.customId === '👥') {
                selectorReply(reactionSelector, '👥', `En présentiel`)
                const date = await userResponseContent(dmChannel, `A quelle date et heure se tiendra votre AG?`).catch(err => console.log(err))
                if (!date) return;
                const customName = await userResponseContent(dmChannel, `Quel est le nom de cette assemblée générale? \`(exemple: AG de début d'année)\``).catch(err => console.log(err))
                if (!customName) return;
                const localisation = await userResponseContent(dmChannel, `Dans quel lieux se tiendra cette assemblée générale?`).catch(err => console.log(err))
                if (!localisation) return;

                const confirmation = await askForConfirmation(dmChannel, `Êtes vous sur de vouloir une invitation d'AG à \`\`\`\n${allAssoMembers.map(member => member.userTag).join('\n')}\`\`\``)
                if (!confirmation) return;

                const newAG = await Presence.create({
                    name: customName,
                    type: 'AG',
                    date: date,
                    running: true,
                    open: false,
                    audience: allAssoMembers
                })

                const tempMsg = await dmChannel.send(`**${loading} | **Début de l'envoi des invitations...`)
                const success = []
                const errors = []
                const userErrors = []
                for (const User of allAssoMembers) {
                    const guildMember = allMembers.get(User.discordId)
                    const userDmChannel = await guildMember.user.createDM()

                    if (!guildMember) {
                        userErrors.push(User.userTag)
                        continue;
                    }

                    const componentRow = createButtonActionRow([
                        createButton(`checkPresence|${newAG._id}`, 'Présent', 'SUCCESS')
                    ])
                    const embed = new MessageEmbed()
                        .setTitle(`**INVITATION :** \`${newAG.name}\``)
                        .setDescription(`Tu as été invité à l'assemblée générale : \`${newAG.name}\` par \`${interaction.user.username}\`\nDate de l'assemblée générale: \`${date}\`\nLieu de l'assemblée générale : \`${localisation}\`\n\n🔽 Tu pourras t'enregistrer présent une fois l'appel ouvert 🔽`)
                        .setColor('#d35400')
                    try {
                        await userDmChannel.send({
                            embeds: [embed],
                            components: [componentRow]
                        })
                        success.push(guildMember.user.tag)
                        await tempMsg.edit(`**${loading} | **Envoi des invitations en cours : \`${success.length + errors.length}/${allAssoMembers.length}\``)
                    } catch (err) {
                        errors.push(guildMember.user.tag)
                    }
                }


                await tempMsg.edit(`**✅ | **Invitations envoyées avec succès à \`${success.length}/${allAssoMembers.length}\` membres`)
                const informationEmbed = new MessageEmbed()
                    .setTitle(`ℹ Informations ℹ`)
                    .setDescription(`Vous avez crée une assemblée générale avec les paramètres suivants : \nNom : \`${newAG.name}\`\nDate : \`${date}\`\nLieu : \`${localisation}\`\n\nCette commande ne démarre pas l'assemblée générale, il en crée juste une avec les paramètres renseignées et invite les joueurs en DM, afin de démarrer l'assemblée générale et donc d'ouvrir l'appel, merci de re-cliquer sur le bouton \`Gérer les Assemblées Générales\`\n\n🔽 COMPTE RENDU DES INVITATIONS 🔽\n`)
                    .addField('✅ UTILISATEURS INVITES', `\`\`\`${success.length > 0 ? success.join('\n'): 'Aucun'}\`\`\``, false)
                    .addField(`✉ UTILISATEURS INJOIGNABLES EN DM`, `\`\`\`${errors.length > 0 ? errors.join(',\n') : 'Aucun'}\`\`\``, false)
                    .addField(`❌ UTILISATEURS INTROUVABLES SUR LE SERVEUR`, `\`\`\`${userErrors.length > 0 ? userErrors.join(',\n') : 'Aucun'}\`\`\``, false)
                    .setColor('#3498db')
                agLogger.setLogData(`NOM : \`${newAG.name}\`\nDATE : \`${date}\`\nLIEU : \`${localisation}\``)
                agLogger.info(`<@!${interaction.user.id}> a crée une AG avec les paramètres suivants :`)
                await dmChannel.send({
                    embeds: [informationEmbed]
                })
            } else {
                selectorReply(reactionSelector, '❌', `Commande annulée`)
            }
        }
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