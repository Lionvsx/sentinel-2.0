const { MessageEmbed } = require('discord.js')
const mongoose = require('mongoose')
const { chunkArray } = require('./utilitaryFunctions')
const { getDateTime } = require('./systemFunctions')
const { isMember } = require('./dbFunctions')

const updateUserDashboard = async (sortFunction, interaction) => {
    const embedsArray = [];

    embedsArray.push(
        new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("DASHBOARD DE CONFIGURATION")
            .setDescription(`Vous permet de gérer tout les membres du serveur LDV Esport inscrits dans la DB\n\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
    )

    const allUsers = await mongoose.model('User').find({ onServer: true, isMember: true})
    const userRows = []
    const roleRows = []
    const memberRows = []

    allUsers.sort(sortFunction)

    for (const user of allUsers) {
        await user.isMember ? isMember(user) ? memberRows.push(`${user.firstName} - ${user.lastName}`) : memberRows.push(`DATA INCOMPLETE`) : memberRows.push(`NOT MEMBER`)
        await user.isAdmin ? roleRows.push(`ADMIN`) : user.isBureau ? roleRows.push(`BUREAU`) : user.isResponsable ? roleRows.push(`RESPONSABLE`) : user.isMember ? roleRows.push(`MEMBER`) : roleRows.push(`USER`)
        userRows.push(user.userTag)
    }
    const userChunks = chunkArray(userRows, 50)
    const roleChunks = chunkArray(roleRows, 50)
    const memberChunks = chunkArray(memberRows, 50)

    for (let i = 0; i < userChunks.length; i++) {
        embedsArray.push(new MessageEmbed().addFields(
            { name: `\`User\``, value: `\`\`\`\n${userChunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`Member Status\``, value: `\`\`\`\n${memberChunks[i].join('\n')}\`\`\``, inline: true },
            { name: `\`Role\``, value: `\`\`\`\n${roleChunks[i].join('\n')}\`\`\``, inline: true }
        ).setColor('#f1c40f'))
    }

    await interaction.update({
        embeds: embedsArray
    })
}

module.exports = {
    updateUserDashboard
}