const { MessageButton, MessageActionRow } = require('discord.js')

module.exports = {
    createButton,
    createEmojiButton,
    createButtonActionRow,
    createEmojiActionRow
}

function createButton(buttonId, buttonText, buttonStyle) {
    return new MessageButton()
        .setCustomId(buttonId)
        .setLabel(buttonText)
        .setStyle(buttonStyle)
}

function createEmojiButton(buttonId, buttonText, buttonStyle, emoji) {
    return new MessageButton()
        .setCustomId(buttonId)
        .setLabel(buttonText)
        .setStyle(buttonStyle)
        .setEmoji(emoji)
}

function createEmojiActionRow(emojiArray) {
    const emojiActionRow = new MessageActionRow()
    for (const emoji of emojiArray) {
        emojiActionRow.addComponents(
            createEmojiButton(emoji, '', 'PRIMARY', emoji)
        )
    }
    return emojiActionRow
}

function createButtonActionRow(buttonArray) {
    const buttonActionRow = new MessageActionRow()
    for (const button of buttonArray) {
        buttonActionRow.addComponents(
            button
        )
    }
    return buttonActionRow
}

