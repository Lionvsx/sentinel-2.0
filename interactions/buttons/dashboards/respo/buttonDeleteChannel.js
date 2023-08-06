const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const mongoose = require('mongoose')
const { createSelectionMenuOption, createSelectionMenu, createMessageActionRow } = require('../../../../utils/functions/messageComponents')
const { getEmoji, removeEmojis, removeDivider } = require('../../../../utils/functions/utilitaryFunctions')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

module.exports = class DeleteChannelButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonDeleteChannel', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const dmChannel = await interaction.user.createDM()

        const loading = client.emojis.cache.get('741276138319380583')

        const userDB = await mongoose.model('User').findOne({ onServer: true, discordId: interaction.user.id })

        const allChannels = interaction.guild.channels.cache

        if (!userDB.roleResponsable) {
            return interaction.reply({
                content: `**<:x_:1137419292946727042> | **Vous n'êtes pas responsable dans la base de données !`,
                ephemeral: true
            })
        }

        const channelLogger = new DiscordLogger('channel', '#00cec9')
        channelLogger.setLogMember(interaction.member)
        channelLogger.setGuild(interaction.guild)

        await interaction.deferUpdate()

        const embed = new MessageEmbed()
            .setDescription(`Bonjour ${interaction.user.username}, \nQuel channel(s) voulez vous supprimer?`)
            .setColor('2b2d31')
        const categoryOptions = getCategoryMenuOptions(allChannels.get(poleCategoryIds[userDB.roleResponsable]))

        const selectionMenuComponent = createSelectionMenu('selectionChannelDelte', 'Veuillez sélectionner un ou plusieurs channel(s)', categoryOptions, 1, categoryOptions.length)
        const selectionMenuMessage = await dmChannel.send({
            embeds: [embed],
            components: [createMessageActionRow([selectionMenuComponent])]
        })

        const selectionMenuInteraction = await menuInteraction(selectionMenuMessage).catch(err => console.log(err))
        if (!selectionMenuInteraction) return;

        if (selectionMenuInteraction.values[0] === 'CANCEL') return selectionMenuInteraction.update({
            embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> | **Commande annulée`)],
            component: []
        })

        selectionMenuInteraction.deferUpdate()

        const confirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir supprimer \`${selectionMenuInteraction.values.length}\` salons?`)
        if (!confirmation) return;

        const tempMsg = await dmChannel.send(`**${loading} | **Suppression en cours ...`)

        const deletedChannelsNames = []
        for (const channelId of selectionMenuInteraction.values) {
            let channel = allChannels.get(channelId)
            
            deletedChannelsNames.push(channel.name)
            await channel.delete()

        }

        tempMsg.edit(`**<:check:1137390614296678421> | **\`${selectionMenuInteraction.values.length}\` channels supprimés !`)

        channelLogger.setLogData(deletedChannelsNames.join('\n'))

        channelLogger.info(`<@!${interaction.user.id}> a supprimé \`${deletedChannelsNames.length}\` channel(s) de sa catégorie`)
    }
}

/**
 * 
 * @param {object} categogyChannel 
 * @returns {object[]}
 */
const getCategoryMenuOptions = (categoryChannel) => {
    const allChannels = categoryChannel.guild.channels.cache
    const childChannels = allChannels.filter(channel => channel.parent === categoryChannel && !channel.name.toLowerCase().includes('annonces') && !channel.name.toLowerCase().includes('requests'))

    const optionsArray = []

    for (const [channelId, channel] of childChannels) {
        let emoji = getEmoji(channel.name)
        const name = removeDivider(removeEmojis(channel.name))?.trim()

        // If emoji is bugged, fix
        if (emoji.length > 2) {
            // Take first 2 caracters
            emoji = emoji.substring(0, 2)
        }
        
        optionsArray.push(
            createSelectionMenuOption(channel.id, name, undefined, emoji)
        )
    }

    return optionsArray;
}


const poleCategoryIds = {
    webtv : "741688834525364265",
    da :  "741688796864839730",
    com :  "741991177858842685",
    event : "742083412990361621",
    esport : "741991157550022726",
    partenariat :"894735891329847396"
}