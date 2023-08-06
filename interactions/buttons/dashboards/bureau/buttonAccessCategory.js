const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')

const mongoose = require('mongoose')
const {
    fillSelectMap, updateSelectionMenu
} = require('../../../../utils/functions/utilitaryFunctions')
const { createButton, createMessageActionRow, createSelectionMenu, createSelectionMenuOption, createButtonActionRow, createEmojiButton } = require('../../../../utils/functions/messageComponents')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

module.exports = class AccessCategoryButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonAccessCategory', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()


        const loading = client.emojis.cache.get('741276138319380583')

        const dmChannel = await interaction.user.createDM()
        const allChannels = interaction.guild.channels.cache
        const categoryChannels = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY')

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)


        let index = 0
        const categoriesMap = fillSelectMap(categoryChannels);

        const selectMenu = createMessageActionRow([createSelectionMenu(`catMenu`, 'Page 1', categoriesMap[index], 1, categoriesMap[index].length)])
        const buttonRow = createButtonActionRow([createEmojiButton(`previous`, '', 'SECONDARY', '<:arrowleftcircle:1137421111378837585>'), createEmojiButton(`valid`, '', 'SECONDARY', '<:check:1137390614296678421>'), createEmojiButton(`next`, '', 'SECONDARY', '<:arrowrightcircle:1137421115766083726>')])

        let arrayOfCategoryIds = []
        
        let embedSelected = new MessageEmbed()
            .setColor('#247ba0')
            .setTitle('Catégories sélectionnées')
            .setDescription(`\`\`\`\nAucune\`\`\`\n\n<:arrowdown:1137420436016214058> Veuillez sélectionner une catégorie ci-dessous <:arrowdown:1137420436016214058>`)

        let message = await dmChannel.send({
            embeds: [embedSelected],
            components: [selectMenu, buttonRow]
        })
        const filter = (interaction) => interaction.message.id === message.id

        const collector = dmChannel.createMessageComponentCollector({ filter, idle: 30000 })

        collector.on('collect', interaction => {
            if (interaction.isButton()) {
                if (interaction.customId === 'previous') updateSelectionMenu(interaction, arrayOfCategoryIds, index = index-1, categoriesMap, allChannels)
                else if (interaction.customId === 'next') updateSelectionMenu(interaction, arrayOfCategoryIds, index = index-1, categoriesMap, allChannels)
                else if (interaction.customId === 'valid') {
                    collector.stop()
                    interaction.update({
                        components: []
                    })
                }
            } else if (interaction.isSelectMenu() && interaction.customId === 'catMenu') {
                let toRemove = arrayOfCategoryIds.filter(n => interaction.values.includes(n))
                arrayOfCategoryIds = arrayOfCategoryIds.concat(interaction.values)
                arrayOfCategoryIds = arrayOfCategoryIds.filter(n => !toRemove.includes(n))
                updateSelectionMenu(interaction, arrayOfCategoryIds, index, categoriesMap, allChannels)
            }
        })

        collector.on('end', async (collected, reason) => {
            if (reason === 'idle') {
                return message.edit({
                    embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> Commande annulée : \`Timed Out\`**`).setColor('#c0392b')],
                    components: []
                })
            }
            const selectedCategories = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY' && arrayOfCategoryIds.includes(channel.id))
            const tempMsg = await dmChannel.send(`**${loading} | **Ajout des accès aux catégories en cours...`)

            for (const [categoryId, category] of selectedCategories) {
                const childrenChannels = allChannels.filter(channel => channel.parentId === categoryId)
                configLogger.info(`<@!${interaction.user.id}> a accédé à la catégorie \`${category.name}\``)
                category.permissionOverwrites.create(interaction.user, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    CONNECT: true,
                })
                for (const [channelId, channel] of childrenChannels) {
                    channel.permissionOverwrites.create(interaction.user, {
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: true,
                        CONNECT: true,
                    })
                }
            }
            tempMsg.edit(`**<:check:1137390614296678421> | **Accès accordé  à ${selectedCategories?.size} catégories`)
        }) 
    }
}





