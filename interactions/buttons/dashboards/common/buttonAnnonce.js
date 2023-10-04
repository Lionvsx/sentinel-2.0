const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString, updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const { createSelectionMenuOption, createSelectionMenu, createMessageActionRow } = require('../../../../utils/functions/messageComponents')
const { MessageEmbed } = require('discord.js')
const DiscordLogger = require('../../../../utils/services/discordLoggerService')


module.exports = class AnnonceButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonAnnonce', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()


        const dmChannel = await interaction.user.createDM()
        
        const allChannels = interaction.guild.channels.cache
        const allMembers = await updateGuildMemberCache(interaction.guild);

        const signatureEmbed = new MessageEmbed()
            .setDescription(`<:mail:1137430731925241996>️ Message d'annonce diffusé par le **Head Staff**\nAuteur : \`${interaction.user.tag}\``)
            .setColor('#2b2d31')
            .setTimestamp()
        const annoucementMessage = await userResponse(dmChannel, "Veuillez écrire ci dessous le message que vous souhaitez diffuser !").catch(err => console.log(err))
        if (!annoucementMessage) return
        
        const annonceLogger = new DiscordLogger('annonces', '#a29bfe')
        annonceLogger.setGuild(interaction.guild)
        annonceLogger.setLogMember(interaction.member)

        const embedMethodeDiffusion = new MessageEmbed()
            .setDescription("Quelle methode de diffusion voulez vous utiliser?")
            .addFields(
                { name: '<:mail:1137430731925241996>️ ` DM `', value: 'Diffusez votre message à plusieurs utilisateurs en message privé', inline: false },
                { name: '<:messagecircle:1137423168080973874> ` Channel `', value: "Diffusez votre message dans un channel textuel", inline: false },
                { name: '<:x_:1137419292946727042> ` Cancel `', value: "Annulez la commande", inline: false },
            )
            .setColor('2b2d31')
        
        const selectorInteraction = await reactionEmbedSelector(dmChannel, ['<:mail:1137430731925241996>️', '<:messagecircle:1137423168080973874>', '<:x_:1137419292946727042>'], embedMethodeDiffusion).catch(err => console.log(err))
        if (!selectorInteraction) return
        const emoji = selectorInteraction.customId
        switch (emoji) {
            case '<:mail:1137430731925241996>️':
                selectorReply(selectorInteraction, emoji, 'Diffusez votre message à plusieurs utilisateurs en message privé')
                const searchTerm = await userResponse(dmChannel, "A quels utilisateurs voulez vous envoyer votre message? \`(everyone ou nom d'un rôle ou pseudo, séparées d'une virgule)\`").catch(err => console.log(err))
                if (!searchTerm) return
                if (searchTerm.content === 'everyone') {
                    let audience = allMembers.cache.filter(m => m.user.bot === false)
                    const confirmation = await askForConfirmation(dmChannel, `Etes vous sûrs de vouloir envoyer un message à **tout le serveur** : \`${audience.size}\` utilisateurs !`).catch(err => console.log(err))
                    
                    if (!confirmation) return
                    await broadcastMessage(client, dmChannel, audience, {
                        content: annoucementMessage.content,
                        embeds: [signatureEmbed],
                        files: annoucementMessage.attachments
                    })
                } else {
                    let searchArgs = searchTerm.content.split(/\s*[,]\s*/)
                    let audience = await getUsersFromString(interaction.guild, searchArgs)
                    if (audience.length === 0) return dmChannel.send(`**<:x_:1137419292946727042> | **Aucun utilisateur sélectionné !`)
                    const confirmation = await askForConfirmation(dmChannel, `Etes vous sûrs de vouloir envoyer un message aux utilisateurs suivants : \`\`\`${audience.map(member => member.user.tag).join('\n')}\`\`\``).catch(err => console.log(err))
                    
                    annonceLogger.setLogData(audience.map(member => member.user.tag).join('\n'))
                    if (!confirmation) return
                    await broadcastMessage(client, dmChannel, audience, annonceLogger, {
                        content: annoucementMessage.content,
                        embeds: [signatureEmbed],
                        files: annoucementMessage.attachments
                    })
                }
                break;


            case '<:messagecircle:1137423168080973874>':
                selectorReply(selectorInteraction, emoji, 'Diffusez votre message dans un channel textuel')
                const embedChannels = new MessageEmbed()
                    .setDescription("A quel(s) channels(s) voulez vous envoyer votre message?")
                    .addFields(
                        { name: '<:users:1137390672194850887> ` TEAMS `', value: "Envoyez à tous les channels d'équipe", inline: false },
                        { name: '<:coffee:1137422686432272446> ` STAFF `', value: "Envoyez dans certains poles (staff)", inline: false },
                        { name: '<:link:1137424150764474388> ` CUSTOM `', value: "Envoyez dans un channel personnalisé", inline: false },
                        { name: '<:x_:1137419292946727042> ` CANCEL `', value: "Annulez la commande", inline: false },
                    )
                    .setColor('#2b2d31')
                
                const selectorChannelsInteraction = await reactionEmbedSelector(dmChannel, ['<:users:1137390672194850887>', '<:coffee:1137422686432272446>', '<:link:1137424150764474388>', '<:x_:1137419292946727042>'], embedChannels).catch(err => console.log(err))
                if (!selectorChannelsInteraction) return
                const emojiSelectorChannel = selectorChannelsInteraction.customId
                
                switch (emojiSelectorChannel) {
                    case '<:users:1137390672194850887>':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Envoyez à tous les channels d\'équipe')
                        let audienceChannels = interaction.guild.channels.cache.filter(channel => channel.name === '📌┃organisation')
                        annonceLogger.setLogData(audienceChannels.map(channel => channel.name).join('\n'))
                        if (audienceChannels.size > 1) broadcastMessageChannels(client, dmChannel, audienceChannels, annonceLogger, {
                            content: annoucementMessage.content,
                            embeds: [signatureEmbed],
                            files: annoucementMessage.attachments
                        })
                        break;
                    case '<:coffee:1137422686432272446>':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, "Envoyez dans certains poles (staff)")

                        const polesOptionsArray = [
                            createSelectionMenuOption('741961820876570724', 'Web TV', 'Envoyer à la webTV', '<:video:1137424148352737310>'),
                            createSelectionMenuOption('741810169700286544', 'Direction Artistique', 'Envoyer à la DA', '<:bookmark:1137437120139640842>'),
                            createSelectionMenuOption('742069661495066774', 'Communication', 'Envoyer à la com', '<:pentool:1137435985186136195>'),
                            createSelectionMenuOption('1019911006547365938', 'Event', 'Envoyer à l\'event', '<:speaker:1137428526178517033>'),
                            createSelectionMenuOption('742069647679160411', 'Esport', 'Envoyer à l\'esport', '<:crosshair:1137436482248904846>'),
                            createSelectionMenuOption('894736312660275270', 'Partenariat', 'Envoyer au partenariat', '<:dollarsign:1137435764142116904>')
                        ]
            
                        const selectionMenu = createSelectionMenu('menuSelectPolesAnnonces', 'Selectionner un ou plusieurs pôles', polesOptionsArray, 1, 6)

                        const menuMessage = await dmChannel.send({
                            embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> A quels pôles voulez vous envoyer votre message? <:arrowdown:1137420436016214058>').setColor('2b2d31')],
                            components: [createMessageActionRow([selectionMenu])]
                        })
            
                        const selectionMenuInteraction = await menuInteraction(menuMessage).catch(err => console.log(err))
                        if (!selectionMenuInteraction) return;
            
                        const selectedChannelIds = selectionMenuInteraction.values;

                        const selectedChannels = interaction.guild.channels.cache.filter(channel => selectedChannelIds.includes(channel.id))

            
                        selectionMenuInteraction.update({
                            embeds: [new MessageEmbed().setDescription(`<:check:1137390614296678421> Selectionné : \n\`${selectedChannels.map(channel => channel.parent.name).join('\n')}\``).setColor('2b2d31')],
                        })

                        annonceLogger.setLogData(selectedChannels.map(channel => `${channel.name} dans ${channel.parent.name}`).join('\n'))
                        broadcastMessageChannels(client, dmChannel, selectedChannels, annonceLogger, {
                            content: annoucementMessage.content,
                            embeds: [signatureEmbed],
                            files: annoucementMessage.attachments
                        })
                        
                        
                        break;
                    case '<:link:1137424150764474388>':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, "Envoyez dans un channel personnalisé")
                        const categoryChannels = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY')
                        dmChannel.send({
                            embeds: [new MessageEmbed().setTitle(`Catégories du serveur ${interaction.guild.name}`).setDescription(`\`\`\`${categoryChannels.map(channel => channel.name).join('\n')}\`\`\``)]
                        })
                        const selectedCategoryString = await userResponseContent(dmChannel, "Dans quelle catégorie voulez vous envoyez votre message?")
                        if (!selectedCategoryString) return

                        //A TERMINER
                        break;
                    case '<:x_:1137419292946727042>':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Commande annulée')
                        break;
                    default: 
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Commande Invalide')
                        break;
                }
                break;
            case '<:x_:1137419292946727042>':
                selectorReply(selectorInteraction, emoji, 'Commande annulée')
                break;
            default:
                selectorReply(selectorInteraction, emoji, 'Commande Invalide')
                break;
        }


    }
}

const broadcastMessage = (client, channel, audience, annonceLogger, message) => {
    return new Promise(async (resolve) => {
        let errorsDMS = []
        const loading = client.emojis.cache.get('741276138319380583')
        const tempMsg = await channel.send(`**${loading} |** Début de l'envoi de votre message à \`${audience.length}\` utilisateurs`)
        let count = 0
        let errorsCount = 0
        for (const member of audience) {
            const dmChannel = await member.createDM();
            try {
                await dmChannel.send(message)
                count++;
                tempMsg.edit(`**${loading} |** Envoi de votre message en cours : \`${count + errorsCount}/${audience.length}\``)
            } catch (err) {
                console.error(err)
                await channel.send(`**<:x_:1137419292946727042> | **Impossible d'envoyer le message à \`${member.user.username}\``)
                errorsDMS.push(member.user.username)
                errorsCount++;
            }

            if (count + errorsCount === audience.length) {
                let emoji = '<:alerttriangleyellow:1137390607069888593>'
                if(errorsCount === 0) {
                    emoji = '<:check:1137390614296678421>'
                    annonceLogger.info(`Message d'annonce envoyé à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !`)
                } else annonceLogger.warning(`Message d'annonce envoyé à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !\n**Erreurs :**\n${errorsDMS.join('\n')}`)
                await tempMsg.edit(`**${emoji} |** Message envoyé avec succès à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !\n**Erreurs :**\n\`${errorsDMS.length > 0 ? errorsDMS.join('\n') : "Aucune"}\``)
                resolve()
            }
        }
    })
}

const broadcastMessageChannels = (client, channel, channelsAudience, annonceLogger, message) => {
    return new Promise(async (resolve) => {
        const loading = client.emojis.cache.get('741276138319380583')
        const tempMsg = await channel.send(`**${loading} |** Début de l'envoi de votre message dans \`${channelsAudience.size}\` channels`)
        let count = 0
        let errorsCount = 0
        for (const [, channel] of channelsAudience) {
            try {
                await channel.send(message)
                count++;
                tempMsg.edit(`**${loading} |** Envoi de votre message en cours dans : \`${count + errorsCount}/${channelsAudience.size}\` channels`)
            } catch (err) {
                console.error(err)
                await channel.send(`**<:x_:1137419292946727042> | **Impossible d'envoyer le message dans le channel \`${channel.name}\``)
                errorsCount++;
            }

            if (count + errorsCount === channelsAudience.size) {
                let emoji = '<:alerttriangleyellow:1137390607069888593>'
                if(errorsCount === 0) {
                    emoji = '<:check:1137390614296678421>'
                    annonceLogger.info(`Message d'annonce envoyé à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                } else annonceLogger.warning(`Message d'annonce envoyé à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                await tempMsg.edit(`**${emoji} |** Message envoyé avec succès à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                resolve()
            }
        }
    })
}