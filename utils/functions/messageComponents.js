const { MessageButton, MessageActionRow, MessageSelectMenu } = require('discord.js')

module.exports = {
    createButton,
    createEmojiButton,
    createButtonActionRow,
    createEmojiActionRow,
    createMessageActionRow,
    createSelectionMenu,
    createSelectionMenuOption
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
            createEmojiButton(emoji, '', 'SECONDARY', emoji)
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

function createMessageActionRow(componentsArray) {
    const actionRow = new MessageActionRow()
    for (const component of componentsArray) {
        actionRow.addComponents(
            component
        )
    }
    return actionRow
}

/**
 * 
 * @param {String} menuId 
 * @param {String} placeholderText 
 * @param {Object[]} menuOptionArray 
 * @param {Number} minSelections 
 * @param {Number} maxSelections 
 * @returns {MessageSelectMenu}
 */
function createSelectionMenu(menuId, placeholderText, menuOptionArray, minSelections, maxSelections) {
    return new MessageSelectMenu()
        .setCustomId(menuId)
        .setPlaceholder(placeholderText)
        .addOptions(menuOptionArray)
        .setMinValues(minSelections)
        .setMaxValues(maxSelections)
}

function createSelectionMenuOption(optionId, displayText, optDescription, optEmoji, optIsDefaultOption) {
    return {
        label: displayText,
        value: optionId,
        description: optDescription ?  optDescription : undefined,
        emoji: optEmoji ? optEmoji : undefined,
        default: optIsDefaultOption ? optIsDefaultOption : undefined
    }
}
