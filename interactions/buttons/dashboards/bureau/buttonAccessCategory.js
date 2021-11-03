const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')

const mongoose = require('mongoose')
const { updateGuildMemberCache, getEmoji, getDuplicates } = require('../../../../utils/functions/utilitaryFunctions')
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
        interaction.deferUpdate()


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
        const buttonRow = createButtonActionRow([createEmojiButton(`previous`, 'Page précédente', 'SECONDARY', '⬅️'), createEmojiButton(`valid`, 'Valider', 'SUCCESS', '✅'), createEmojiButton(`next`, 'Page suivante', 'SECONDARY', '➡️')])

        let arrayOfCategoryIds = []
        
        let embedSelected = new MessageEmbed()
            .setColor('#247ba0')
            .setTitle('Catégories sélectionnées')
            .setDescription(`\`\`\`\nAucune\`\`\`\n\n🔽 Veuillez sélectionner une catégorie ci-dessous 🔽`)

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
                    embeds: [new MessageEmbed().setDescription(`**❌ Commande annulée : \`Timed Out\`**`).setColor('#c0392b')],
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
            tempMsg.edit(`**✅ | **Accès accordé  à ${selectedCategories?.size} catégories`)
        }) 
    }
}

/**
 * 
 * @param {object} interaction 
 * @param {string[]} arrayOfCategoryIds 
 * @param {number} index 
 * @param {object[]} categoriesMap 
 * @param {object} allChannels 
 */
function updateSelectionMenu(interaction, arrayOfCategoryIds, index, categoriesMap, allChannels) {

    
    index = ((index%categoriesMap.length) + categoriesMap.length)%categoriesMap.length

    const selectMenu = createMessageActionRow([createSelectionMenu(`catMenu`, `Page ${index + 1}`, categoriesMap[index], 1, categoriesMap[index].length)])
    const buttonRow = createButtonActionRow([createEmojiButton(`previous`, 'Page précédente', 'SECONDARY', '⬅️'), createEmojiButton(`valid`, 'Valider', 'SUCCESS', '✅'), createEmojiButton(`next`, 'Page suivante', 'SECONDARY', '➡️')])
    

    const selectedCategories = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY' && arrayOfCategoryIds.includes(channel.id))

    let embedSelected = new MessageEmbed()
    .setColor('#247ba0')
    .setTitle('Catégories sélectionnées')
    .setDescription(`\`\`\`\n${selectedCategories?.size > 0 ? selectedCategories.map(chan => chan.name).join('\n'): 'Aucune'}\`\`\`\n\n🔽 Veuillez sélectionner une catégorie ci-dessous 🔽`)

    interaction.update({
        embeds: [embedSelected],
        components: [selectMenu, buttonRow]
    })
}

function fetchName(str) {
    return str.replace(/[^a-zA-Z éèêàù]+/g, '').trim();
}

/**
 * 
 * @param {String} str 
 * @returns {Void} 
 */
function fetchEmoji(str) {
    let i = 0
    let char = str.charAt(i)
    while (i < str.length && (char === '─' || char === ' ')) {
        i++
        char = str.charAt(i)
    }
    const emoji = `${char + str.charAt(i+1)}`
    return String.fromCodePoint(emoji.codePointAt(0));
}
/**
 * 
 * @param {String} categoryChannels 
 * @returns {void}
 */
function fillSelectMap(categoryChannels) {
    let i = 0
    let tmpArr = []
    let map = []

    for (const [key, cat] of categoryChannels) {
        if (i === 25) {
            i = 0
            map.push(tmpArr)
            tmpArr = []
        }
        tmpArr.push(createSelectionMenuOption(cat.id, fetchName(cat.name), undefined, fetchEmoji(cat.name)))
        i++
    }
    map.push(tmpArr)
    return map
}



