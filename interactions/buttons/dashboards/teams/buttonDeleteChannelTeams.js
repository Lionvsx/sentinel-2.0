const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { askForConfirmation, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Team} = require('discord.js')
const mongoose = require('mongoose')
const { createSelectionMenuOption, createSelectionMenu, createMessageActionRow } = require('../../../../utils/functions/messageComponents')
const { getEmoji, removeEmojis, removeDivider } = require('../../../../utils/functions/utilitaryFunctions')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const Teams = require("../../../../src/schemas/TeamSchema");

module.exports = class DeleteChannelTeams extends BaseInteraction {
    constructor() {
        super('buttonDeleteChannelTeams', 'teams', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return

        let parentCategoryId = buttonArgs[1]
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})

        if (!Team) return interaction.reply('<:x_:1137419292946727042> Erreur critique de configuration')

        const dmChannel = await interaction.user.createDM()

        const loading = client.emojis.cache.get('741276138319380583')

        const allChannels = interaction.guild.channels.cache


        const channelLogger = new DiscordLogger('channel', '#00cec9')
        channelLogger.setLogMember(interaction.member)
        channelLogger.setGuild(interaction.guild)

        await interaction.reply({
            content: '<:check:1137390614296678421> Check tes DMS',
            ephemeral: true
        })

        const embed = new MessageEmbed()
            .setDescription(`<:arrowdown:1137420436016214058> Quel channel(s) voulez vous supprimer? <:arrowdown:1137420436016214058>`)
            .setColor('#2b2d31')
        const categoryOptions = getCategoryMenuOptions(allChannels.get(Team.linkedCategoryId))

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

        channelLogger.info(`<@!${interaction.user.id}> a supprimé \`${deletedChannelsNames.length}\` channel(s) de la catégorie bureau`)
    }
}

/**
 *
 * @returns {createSelectionMenuOption[]}
 * @param categoryChannel
 */
const getCategoryMenuOptions = (categoryChannel) => {
    const allChannels = categoryChannel.guild.channels.cache
    const childChannels = allChannels.filter(channel => channel.parent === categoryChannel)

    let deletableChannels = childChannels.filter(c => c.name !== "📌┃organisation" && c.name !== "💬┃discussion" && c.name !== "📒┃fichiers" && c.name !== "🔗┃staff" && c.name !== "🧭┃dashboard" && c.name !== "🔊┃Team Vocal" && c.name !== "🔎┃Coach")

    const optionsArray = []

    for (const [, channel] of deletableChannels) {
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