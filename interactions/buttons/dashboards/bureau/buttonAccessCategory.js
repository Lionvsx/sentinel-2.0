const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, menuInteraction, menuInteractionNoTimeout, selectorReply, buttonInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js')

const mongoose = require('mongoose')
const { updateGuildMemberCache, getEmoji } = require('../../../../utils/functions/utilitaryFunctions')
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
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })

        const Responsables = await mongoose.model('User').find({ onServer: true, isResponsable: true })
        const dmChannel = await interaction.user.createDM()
        const allChannels = interaction.guild.channels.cache
        const categoryChannels = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY')
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        const categoriesMap = fillSelectMap(categoryChannels);
        let selectMenu = createMessageActionRow([createSelectionMenu('catMenu', 'Page 1', categoriesMap[0], 1, 25)])
        const rowBtns = createButtonActionRow([createEmojiButton('prev', 'Page précédente', 'SECONDARY', '⬅️'), createEmojiButton('valid', 'Valider', 'SUCCESS', '✅'), createEmojiButton('next', 'Page suivante', 'SECONDARY', '➡️')])
        let embedSelected = new MessageEmbed()
            .setColor('#247ba0')
            .setTitle('Catégories sélectionnées')
            .setDescription(`Aucun\n\n🔽 Veuillez sélectionner une catégorie ci-dessous 🔽`)

        let newInteraction = await dmChannel.send({
            embeds: [embedSelected],
            components: [selectMenu, rowBtns]
        })

        let index = 0

        menuInteractionNoTimeout(newInteraction)
            .then(val => {
                updateInteraction(index, interaction, val.values)
            })
            .catch(err => console.log(err))
            
        buttonInteraction(dmChannel, newInteraction)
            .then(val => {
                updateInteraction(index, interaction, [])
            })
            .catch(err => console.log(err))


    }
}

function fetchName(str) {
    return str.replace(/[^a-zA-Z éèêàù]+/g, '').trim();
}

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

function fillSelectMap(categoryChannels) {
    let i = 0
    let tmpArr = []
    let map = []

    categoryChannels.forEach((cat, index) => {
        if (i === 25) {
            i = 0
            map.push(tmpArr)
            tmpArr = []
        }
        tmpArr.push(createSelectionMenuOption(cat.id, fetchName(cat.name), undefined, fetchEmoji(cat.name)))
        i++
    })
    map.push(tmpArr)
    return map
}

function updateInteraction(index, interaction, options) {



    interaction.update({
        embeds: [
            new MessageEmbed()
            .setColor('#247ba0')
            .setTitle('Catégories sélectionnées')
            .setDescription(`${options?.size > 0 ? options.join('\n') : 'Aucun'}\n\n🔽 Veuillez sélectionner une catégorie ci-dessous 🔽`)
        ]
    })
    menuInteractionNoTimeout(newInteraction)
        .then(val => {
            updateInteraction(interaction)
        })
        .catch(err => console.log(err))
        
    buttonInteraction(dmChannel, newInteraction)
        .then(val => {
            updateInteraction(interaction)
        })
        .catch(err => console.log(err))
}