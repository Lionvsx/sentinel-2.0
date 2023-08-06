const { MessageEmbed } = require('discord.js')
const mongoose = require('mongoose')
const { chunkArray } = require('./utilitaryFunctions')
const { getDateTime } = require('./systemFunctions')
const { isMember } = require('./dbFunctions')
const {
    createButtonActionRow,
    createEmojiButton,
    createButton,
    createMessageActionRow,
    createSelectionMenu,
    createSelectionMenuOption
} = require('./messageComponents');

const updateUserDashboard = async (sortFunction, interaction) => {
    const embedsArray = [];

    embedsArray.push(
        new MessageEmbed()
            .setColor('#2b2d31')
            .setTitle("\` DASHBOARD DE CONFIGURATION \`")
            .setDescription(`Vous permet de gérer tout les membres du serveur LDV Esport inscrits dans la DB\n\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
            .setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
    )

    const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true})
    const userRows = []
    const roleRows = []
    const memberRows = []

    allUsers.sort(sortFunction)

    for (const user of allUsers) {
        let fullName = `${user.firstName} ${user.lastName}`
        if (fullName?.length > 20) fullName = `${user.firstName} ${user.lastName?.slice(0, 10.)}.`
        await user.isMember ? isMember(user) ? memberRows.push(`${fullName}`) : memberRows.push(`DATA INCOMPLETE`) : memberRows.push(`NOT MEMBER`)
        await user.isAdmin ? roleRows.push(`ADMIN`) : user.isBureau ? roleRows.push(`BUREAU`) : user.isResponsable ? roleRows.push(`RESPONSABLE`) : user.isMember ? roleRows.push(`MEMBER`) : roleRows.push(`USER`)
        userRows.push(user.username)
    }
    const userChunks = chunkArray(userRows, 50)
    const roleChunks = chunkArray(roleRows, 50)
    const memberChunks = chunkArray(memberRows, 50)

    for (let i = 0; i < userChunks.length; i++) {
        embedsArray.push(new MessageEmbed().addFields(
            { name: `\`User\``, value: `\`\`\`\n${userChunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`Member Status\``, value: `\`\`\`\n${memberChunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`Role\``, value: `\`\`\`\n${roleChunks[i].join('\n')}\`\`\``, inline: true }
        ).setColor('#2b2d31')
        .setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
        )
    }

    await interaction.update({
        embeds: embedsArray
    })
}

/**
 * 
 * @param {function} sortFunction dataset Array sort function
 * @param {object} interaction 
 * @param {Document[]} dataset Mongo DB Array
 * @param {object[]} fieldsArray 
 */
const updateDatabaseView = async (sortFunction, interaction, dataset, fieldsArray) => {
    const embedsArray = [];

    const actionRows = interaction.message.components
    const selectedOption = interaction.component.options.find(option => option.value === interaction.values[0])
    
    for (const button of actionRows[1].components) {
        if (button.customId === 'currentDisplay') button.setLabel(`Affichage : ${fieldsArray[0].name} - ${fieldsArray[1].name} - ${fieldsArray[2].name}`)
        if (button.customId === 'currentSortFunction') button.setLabel(`Option : ${selectedOption.label}`)
        if (button.customId === 'lastUpdate') button.setLabel(`Dernière MAJ : ${getDateTime()}`)
    }

    setDefaultOption(actionRows[2].components[0], interaction.values[0])

    embedsArray.push(
        new MessageEmbed()
            .setColor('2b2d31')
            .setTitle("\` DASHBOARD DE CONFIGURATION \`")
            .setDescription(`Vous permet de gérer tout les membres du serveur LDV Esport inscrits dans la DB\n\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
            .setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
    )


    const column1 = []
    const column2 = []
    const column3 = []

    dataset.sort(sortFunction)
    
    for (const user of dataset) {
        let fullName = `${user.firstName} ${user.lastName}`
        if (fullName?.length > 20) fullName = `${user.firstName} ${user.lastName?.slice(0, 10)}..`
        const userFields = new Map([
            ['fullName', user.isMember ? isMember(user) ? fullName : `DATA INCOMPLETE` : `NOT MEMBER`],
            ['lastName', user.lastName],
            ['firstName', user.firstName],
            ['memberRole', user.isAdmin ? `ADMIN` : user.isBureau ? `BUREAU` : user.isResponsable ? `RESPONSABLE` : user.isMember ? `MEMBER` : `USER`],
            ['memberGeneralRole', " "],
            ['memberSpecificRole', " "],
            ['username', user.username],
            ['userTag', user.userTag],
            ['school', user.school ? user.school : ' '],
            ['schoolYear', user.schoolYear ? user.schoolYear : ' '],
            ['schoolAndYear', user.school && user.schoolYear ? `${user.school} A${user.schoolYear}` : ' '],
            ['presence', user.presence ? user.presence : ' '],
        ])
        

        column1.push(userFields.get(fieldsArray[0].id))
        column2.push(userFields.get(fieldsArray[1].id))
        column3.push(userFields.get(fieldsArray[2].id))


    }
    const column1Chunks = chunkArray(column1, 50)
    const column2Chunks = chunkArray(column2, 50)
    const column3Chunks = chunkArray(column3, 50)

    for (let i = 0; i < column1Chunks.length; i++) {
        embedsArray.push(new MessageEmbed().addFields(
            { name: `\`${fieldsArray[0].name}\``, value: `\`\`\`\n${column1Chunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`${fieldsArray[1].name}\``, value: `\`\`\`\n${column2Chunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`${fieldsArray[2].name}\``, value: `\`\`\`\n${column3Chunks[i].join('\n')}\`\`\``, inline: true }
        ).setColor('2b2d31').setImage("https://cdn.discordapp.com/attachments/1133094075625640167/1133367506300571719/1440x1-00ffff7f.png")
        )
    }

    await interaction.update({
        embeds: embedsArray,
        components: actionRows
    })
}

function setDefaultOption(menuComponent, optionValue) {
    const selectedOption = menuComponent.options.find(option => option.value === optionValue)
    const optionIndex = menuComponent.options.indexOf(selectedOption)

    for (const option of menuComponent.options) {
        option.default = false;
    }

    menuComponent.options[optionIndex].default = true;
}

module.exports = {
    updateUserDashboard,
    updateDatabaseView
}