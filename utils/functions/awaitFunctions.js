const { MessageEmbed } = require('discord.js')
const {
    createEmojiActionRow,
    createButton,
    createButtonActionRow
} = require('./messageComponents')

module.exports = {
    userResponse,
    userResponseContent,
    buttonInteraction,
    reactionEmbedSelector,
    selectorReply,
    askForConfirmation,
    reactionEmbedMultipleSelector,
    askYesOrNo
}

function userResponse(channel, displayMessage) {
    return new Promise(async (resolve, reject) => {
        const filter = m => m.author.bot === false
        const sentMsg = await channel.send({
            content: displayMessage
        })
        channel.awaitMessages({ filter, max: 1, time: 5000, errors: ['time'] })
            .then(collected => {
                resolve(collected.first())
            }).catch(collected => {
                sentMsg.edit(`**❌ | **Commande annulée : \`Timed Out\``)
                reject('User Response Timed Out')
            })
    })
}

function userResponseContent(channel, displayMessage) {
    return new Promise(async (resolve, reject) => {
        const filter = m => m.author.bot === false
        const sentMsg = await channel.send({
            content: displayMessage
        })
        channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                resolve(collected.first().content)
            }).catch(collected => {
                sentMsg.edit(`**❌ | **Commande annulée : \`Timed Out\``)
                reject('User Response Timed Out')
            })
    })
}

function buttonInteraction(channel, message) {
    return new Promise((resolve, reject) => {
        const filter = interaction => interaction.isButton() === true && interaction.user.bot === false && interaction.message.id === message.id;
        channel.awaitMessageComponent({ filter, time: 15000 })
          .then(interaction => resolve(interaction))
          .catch(error => {
              reject(`User Response Timed Out`)
          });
    })
}

function createButtonInteractionCollector(channel, message, idSubmit, idCancel) {
    return new Promise((resolve, reject) => {
        const filter = interaction => interaction.isButton() === true && interaction.user.bot === false && interaction.message.id === message.id;
        const collector = channel.createMessageComponentCollector({ filter, time: 60000 })

        collector.on('collect', interaction => {
            if (interaction.customId === 'submit') collector.end()
            if (interaction.customId === 'cancel') reject(`User Response Timed Out`)
        })

        collector.on('end', collected => resolve(collected))
    })
}

async function reactionEmbedSelector(channel, emojiArray, embed) {
    const sentMessage = await channel.send({
        embeds: [embed],
        components: [createEmojiActionRow(emojiArray)] // 5 Buttons MAX !!
    })
    const interaction = await buttonInteraction(channel, sentMessage).catch(errorMessage => {
        sentMessage.edit({
            embeds: [new MessageEmbed().setDescription(`**❌ Commande annulée**`).setColor('#c0392b')],
            components: []
        })
        throw errorMessage
    })
    return interaction
}

async function reactionEmbedMultipleSelector(channel, emojiArray, embed) {
    const sentMessage = await channel.send({
        embeds: [embed],
        components: [createEmojiActionRow(emojiArray), createButtonActionRow([createButton('submit', 'Valider', 'SUCCESS'), createButton('cancel', 'Annuler', 'DANGER')])]
    })
    const interactionCollector = await createButtonInteractionCollector(channel, sentMessage).catch(errorMessage => {
        sentMessage.edit({
            embeds: [new MessageEmbed().setDescription(`**❌ Commande annulée**`).setColor('#c0392b')],
            components: []
        })
        throw errorMessage
    })
    return interactionCollector
}

function selectorReply(interaction, emoji, text) {
    const embed = new MessageEmbed()
        .setDescription(`**${emoji} Option sélectionnée : **${text}`)
        .setColor('#2ecc71')
    interaction.update({
        embeds: [embed],
        components: [],
        files: []
    })

}

function askForConfirmation(channel, message) {
    return new Promise(async (resolve, reject) => {
        const interaction = await reactionEmbedSelector(channel, ['✅', '❌'], new MessageEmbed()
            .setTitle('⚠ Etes vous sûrs? ⚠')
            .setDescription(message)
            .setColor('#e67e22')).catch(errorMessage => reject(errorMessage))
    
        if (interaction && interaction.customId === '✅') {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`**✅ Commande validée**`).setColor('#2ecc71')],
                components: []
            })
            resolve(true)
        } else if (interaction) {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`**❌ Commande annulée**`).setColor('#c0392b')],
                components: []
            })
            resolve(false)
        }
    })
    
}

function askYesOrNo(channel, message) {
    return new Promise(async (resolve, reject) => {
        const interaction = await reactionEmbedSelector(channel, ['✅', '❌'], new MessageEmbed()
            .setDescription(message)
            .setColor('#e67e22')).catch(errorMessage => reject(errorMessage))

        if (!interaction) return
        if (interaction.customId === '✅') {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`**✅ Oui**`).setColor('#2ecc71')],
                components: []
            })
            resolve(true)
        } else {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`**❌ Non**`).setColor('#c0392b')],
                components: []
            })
            resolve(false)
        }
    })
    
}