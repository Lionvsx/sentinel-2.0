const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString, updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
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
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })


        const dmChannel = await interaction.user.createDM()
        
        const allChannels = interaction.guild.channels.cache
        const allMembers = await updateGuildMemberCache(interaction.guild);

        const signatureEmbed = new MessageEmbed()
            .setDescription(`Message d'annonce diffusé par le **Head Staff**\nAuteur : \`${interaction.user.tag}\``)
            .setTimestamp()  
        const annoucementMessage = await userResponse(dmChannel, "Veuillez écrire ci dessous le message que vous souhaitez diffuser !").catch(err => console.log(err))
        if (!annoucementMessage) return
        
        const annonceLogger = new DiscordLogger('annonces', '#a29bfe')
        annonceLogger.setGuild(interaction.guild)
        annonceLogger.setLogMember(interaction.member)

        const embedMethodeDiffusion = new MessageEmbed()
            .setDescription("Quelle methode de diffusion voulez vous utiliser?")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '✉️', value: 'Diffusez votre message à plusieurs utilisateurs en message privé', inline: true },
                { name: '📢', value: "Diffusez votre message dans un channel textuel", inline: true },
                { name: '❌', value: "Annulez la commande", inline: true },
            )
        
        const selectorInteraction = await reactionEmbedSelector(dmChannel, ['✉️', '📢', '❌'], embedMethodeDiffusion).catch(err => console.log(err))
        if (!selectorInteraction) return
        const emoji = selectorInteraction.customId
        switch (emoji) {
            case '✉️':
                selectorReply(selectorInteraction, emoji, 'Diffusez votre message à plusieurs utilisateurs en message privé')
                const searchTerm = await userResponse(dmChannel, "A quels utilisateurs voulez vous envoyer votre message? \`(everyone ou nom d'un rôle ou pseudo, séparées d'une virgule)\`").catch(err => console.log(err))
                if (!searchTerm) return
                if (searchTerm.content == 'everyone') {
                    let audience = allMembers.cache.filter(m => m.user.bot === false)
                    const confirmation = await askForConfirmation(dmChannel, `Etes vous sûrs de vouloir envoyer un message à **tout le serveur** : \`${audience.size}\` utilisateurs !`).catch(err => console.log(err))
                    
                    if (!confirmation) return
                    broadcastMessage(client, dmChannel, audience, {
                        content: annoucementMessage.content,
                        embeds: [signatureEmbed],
                        files: annoucementMessage.attachments
                    })
                } else {
                    let searchArgs = searchTerm.content.split(/\s*[,]\s*/)
                    let audience = await getUsersFromString(interaction.guild, searchArgs)
                    if (audience.length === 0) return dmChannel.send(`**❌ | **Aucun utilisateur sélectionné !`)
                    const confirmation = await askForConfirmation(dmChannel, `Etes vous sûrs de vouloir envoyer un message aux utilisateurs suivants : \`\`\`${audience.map(member => member.user.tag).join('\n')}\`\`\``).catch(err => console.log(err))
                    
                    annonceLogger.setLogData(audience.map(member => member.user.tag).join('\n'))
                    if (!confirmation) return
                    broadcastMessage(client, dmChannel, audience, {
                        content: annoucementMessage.content,
                        embeds: [signatureEmbed],
                        files: annoucementMessage.attachments
                    })
                }

                break;


            case '📢':
                selectorReply(selectorInteraction, emoji, 'Diffusez votre message dans un channel textuel')
                const embedChannels = new MessageEmbed()
                    .setDescription("A quel(s) channels(s) voulez vous envoyer votre message?")
                    .addFields(
                        { name: '\u200B', value: '\u200B' },
                        { name: '🌐', value: "Envoyez à tous les channels d'équipe", inline: true },
                        { name: '⭐', value: "Envoyez dans certains poles (staff)", inline: true },
                        { name: '🔗', value: "Envoyez dans un channel personnalisé", inline: true },
                        { name: '❌', value: "Annulez la commande", inline: true },
                    )
                
                const selectorChannelsInteraction = await reactionEmbedSelector(dmChannel, ['🌐', '⭐', '🔗', '❌'], embedChannels).catch(err => console.log(err))
                if (!selectorChannelsInteraction) return
                const emojiSelectorChannel = selectorChannelsInteraction.customId
                
                switch (emojiSelectorChannel) {
                    case '🌐':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Envoyez à tous les channels d\'équipe')
                        let audienceChannels = interaction.guild.channels.filter(channel => channel.name.toLowerCase().includes('organisation'))
                        annonceLogger.setLogData(audienceChannels.map(channel => channel.name).join('\n'))
                        if (audienceChannels.size > 1) broadcastMessageChannels(client, dmChannel, audienceChannels, {
                            content: annoucementMessage.content,
                            embeds: [signatureEmbed],
                            files: annoucementMessage.attachments
                        })
                        break;
                    case '⭐':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, "Envoyez dans certains poles (staff)")
                        const StaffAnnonceChannels = [
                            ['da', '741810169700286544'],
                            ['com', '742069661495066774'],
                            ['esport', '742069647679160411'],
                            ['event', '742083440450732043'],
                            ['webtv', '741961820876570724']
                        ]
                        const selectedChannels = await userResponseContent(dmChannel, "Dans quels poles voulez vous envoyez votre message? \`(tous, da, webtv, esport, com, event, séparées d'une virgule !)\`").catch(err => console.log(err))
                        if (!selectedChannels) return
                        // A TERMINER
                        
                        break;
                    case '🔗':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, "Envoyez dans un channel personnalisé")
                        const categoryChannels = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY')
                        dmChannel.send({
                            embeds: [new MessageEmbed().setTitle(`Catégories du serveur ${interaction.guild.name}`).setDescription(`\`\`\`${categoryChannels.map(channel => channel.name).join('\n')}\`\`\``)]
                        })
                        const selectedCategoryString = await userResponseContent(dmChannel, "Dans quelle catégorie voulez vous envoyez votre message?")
                        if (!selectedCategoryString) return

                        //A TERMINER
                        break;
                    case '❌':
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Commande annulée')
                        break;
                    default: 
                        selectorReply(selectorChannelsInteraction, emojiSelectorChannel, 'Commande Invalide')
                        break;
                }
                break;
            case '❌':
                selectorReply(selectorInteraction, emoji, 'Commande annulée')
                break;
            default:
                selectorReply(selectorInteraction, emoji, 'Commande Invalide')
                break;
        }


    }
}

const broadcastMessage = (client, channel, audience, message) => {
    return new Promise(async (resolve) => {
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
                await channel.send(`**:x: | **Impossible d'envoyer le message à \`${member.user.username}\``)
                errorsCount++;
            }

            if (count + errorsCount === audience.length) {
                let emoji = '⚠️'
                if(errorsCount === 0) {
                    emoji = '✅'
                    annonceLogger.info(`Message d'annonce envoyé à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !`)
                } else annonceLogger.warning(`Message d'annonce envoyé à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !`)
                await tempMsg.edit(`**${emoji} |** Message envoyé avec succès à \`${count}\` utilisateur(s) avec \`${errorsCount}\` erreur(s) !`)
                resolve()
            }
        }
    })
}

const broadcastMessageChannels = (client, channel, channelsAudience, message) => {
    return new Promise(async (resolve) => {
        const loading = client.emojis.cache.get('741276138319380583')
        const tempMsg = await channel.send(`**${loading} |** Début de l'envoi de votre message dans \`${channelsAudience.size}\` channels`)
        let count = 0
        let errorsCount = 0
        for (const [channelId, channel] of channelsAudience) {
            try {
                await channel.send(message)
                count++;
                tempMsg.edit(`**${loading} |** Envoi de votre message en cours dans : \`${count + errorsCount}/${channelsAudience.size}\` channels`)
            } catch (err) {
                console.error(err)
                await channel.send(`**:x: | **Impossible d'envoyer le message dans le channel \`${channel.name}\``)
                errorsCount++;
            }

            if (count + errorsCount === channelsAudience.size) {
                let emoji = '⚠️'
                if(errorsCount === 0) {
                    emoji = '✅'
                    annonceLogger.info(`Message d'annonce envoyé à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                } else annonceLogger.warning(`Message d'annonce envoyé à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                await tempMsg.edit(`**${emoji} |** Message envoyé avec succès à \`${count}\` channel(s) avec \`${errorsCount}\` erreur(s) !`)
                resolve()
            }
        }
    })
}