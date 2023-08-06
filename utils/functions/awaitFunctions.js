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
    askYesOrNo,
    menuInteraction,
    menuInteractionNoTimeout
}

function userResponse(channel, displayMessage) {
    return new Promise(async (resolve, reject) => {
        const filter = m => m.author.bot === false
        const sentMsg = await channel.send({
            content: displayMessage
        })
        channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
            .then(collected => {
                resolve(collected.first())
            }).catch(collected => {
                sentMsg.edit(`**<:x_:1137419292946727042> | **Commande annulée : \`Timed Out\``)
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
        channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
            .then(collected => {
                resolve(collected.first().content)
            }).catch(collected => {
                sentMsg.edit(`**<:x_:1137419292946727042> | **Commande annulée : \`Timed Out\``)
                reject('User Response Timed Out')
            })
    })
}

function buttonInteraction(channel, message) {
    return new Promise((resolve, reject) => {
        const filter = interaction => interaction.isButton() === true && interaction.user.bot === false && interaction.message.id === message.id;
        channel.awaitMessageComponent({ filter, time: 30000 })
          .then(interaction => resolve(interaction))
          .catch(error => {
              reject(`User Response Timed Out`)
          });
    })
}

function menuInteraction(message) {
    return new Promise((resolve, reject) => {
        const filter = interaction => interaction.isSelectMenu() === true && interaction.user.bot === false && interaction.message.id === message.id;
        message.awaitMessageComponent({ filter, time: 30000 })
          .then(interaction => resolve(interaction))
          .catch(error => {
            message.edit({
                embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> Commande annulée : \`Timed Out\`**`).setColor('2b2d31')],
                components: []
            })
              reject(`User Response Timed Out`)
          });
    })
}

function menuInteractionNoTimeout(message) {
    return new Promise((resolve, reject) => {
        const filter = interaction => interaction.isSelectMenu() === true && interaction.user.bot === false && interaction.message.id === message.id;
        message.awaitMessageComponent({ filter, time: 30000 })
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
            embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> Commande annulée : \`Timed Out\`**`).setColor('2b2d31')],
            components: []
        })
        throw errorMessage
    })
    return interaction
}

async function reactionEmbedMultipleSelector(channel, emojiArray, embed) {
    const sentMessage = await channel.send({
        embeds: [embed],
        components: [createEmojiActionRow(emojiArray), createButtonActionRow([createButton('submit', 'Valider', 'SUCCESS'), createButton('cancel', 'Annuler', 'SECONDARY')])]
    })
    const interactionCollector = await createButtonInteractionCollector(channel, sentMessage).catch(errorMessage => {
        sentMessage.edit({
            embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> Commande annulée : \`Timed Out\`**`).setColor('2b2d31')],
            components: []
        })
        throw errorMessage
    })
    return interactionCollector
}

function selectorReply(interaction, emoji, text) {
    const embed = new MessageEmbed()
        .setDescription(`**${emoji} Option sélectionnée : **${text}`)
        .setColor('2b2d31')
    interaction.update({
        embeds: [embed],
        components: [],
        files: []
    })

}

function askForConfirmation(channel, message) {
    return new Promise(async (resolve, reject) => {
        const interaction = await reactionEmbedSelector(channel, ['<:check:1137390614296678421>', '<:x_:1137419292946727042>'], new MessageEmbed()
            .setTitle('<:alerttriangleyellow:1137390607069888593> ` Etes vous sûrs? ` <:alerttriangleyellow:1137390607069888593>')
            .setDescription(message)
            .setColor('#2b2d31'))
    
        if (interaction && interaction.customId === '<:check:1137390614296678421>') {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`<:check:1137390614296678421> \` Commande validée \``).setColor('#2b2d31')],
                components: []
            })
            resolve(true)
        } else if (interaction) {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`<:x_:1137419292946727042> \` Commande annulée \``).setColor('#2b2d31')],
                components: []
            })
            resolve(false)
        }
    })
    
}

function askYesOrNo(channel, message) {
    return new Promise(async (resolve, reject) => {
        const interaction = await reactionEmbedSelector(channel, ['<:check:1137390614296678421>', '<:x_:1137419292946727042>'], new MessageEmbed()
            .setDescription(message)
            .setColor('#2b2d31'))

        if (!interaction) return
        if (interaction.customId === '<:check:1137390614296678421>') {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`<:check:1137390614296678421> Oui`).setColor('2b2d31')],
                components: []
            })
            resolve(true)
        } else {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`<:x_:1137419292946727042> Non`).setColor('2b2d31')],
                components: []
            })
            resolve(false)
        }
    })
    
}