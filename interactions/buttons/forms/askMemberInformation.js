const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { menuInteraction, userResponseContent } = require('../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createButton, createSelectionMenuOption } = require('../../../utils/functions/messageComponents')
const mongoose = require('mongoose');

module.exports = class MemberInformationFormButton extends BaseInteraction {
    constructor() {
        super('askMemberInformation', 'forms', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const dmChannel = interaction.channel
        const ldvGuild = client.guilds.cache.get('227470914114158592')
        


        let editedMsg = await interaction.message.edit({
            embeds: [new MessageEmbed().setDescription(`🔽 Veuillez renseigner votre école ci dessous 🔽`).setColor('#00b894')],
            components: [createMessageActionRow([
                createSelectionMenu('schoolMenu', 'Veuillez selectionner une école', [createSelectionMenuOption('esilv', 'ESILV', undefined, '753798801457807442'), createSelectionMenuOption('iim', 'IIM', undefined, '753798801763991650'), createSelectionMenuOption('emlv', 'EMLV', undefined, '753798801919180913'), createSelectionMenuOption('externe', 'EXTERNE', undefined, '👤')], 1, 1)
            ])]
        })

        const schoolMenu = await menuInteraction(editedMsg).catch(err => console.log(err))
        if (!schoolMenu) return restoreForm(dmChannel)

        const school = schoolMenu.values[0];
        let year = undefined

        if (school != 'externe') {
            editedMsg = await interaction.message.edit({
                embeds: [new MessageEmbed().setDescription(`🔽 Veuillez renseigner votre année ci dessous 🔽\n\`\`\`ECOLE : ${school.toUpperCase()}\`\`\``).setColor('#00b894')],
                components: [createMessageActionRow([
                    createSelectionMenu('yearMenu', 'Veuillez selectionner une année', [createSelectionMenuOption('1', 'A1', undefined, '1️⃣'), createSelectionMenuOption('2', 'A2', undefined, '2️⃣'), createSelectionMenuOption('3', 'A3', undefined, '3️⃣'), createSelectionMenuOption('4', 'A4', undefined, '4️⃣'), createSelectionMenuOption('5', 'A5', undefined, '5️⃣')], 1, 1)
                ])]
            })
            const yearMenu = await menuInteraction(editedMsg).catch(err => console.log(err))
            if (!yearMenu) return restoreForm(dmChannel)
            year = yearMenu.values[0];
        }


        editedMsg = await interaction.message.edit({
            embeds: [new MessageEmbed().setDescription(`Informations enregistrées :\n\`\`\`ECOLE: ${school.toUpperCase()}\nANNEE: ${year ? year.toUpperCase() : 'NON DEFINIE'}\`\`\``).setColor('#00b894')],
            components: []
        })
        const firstName = await userResponseContent(dmChannel, `🔽 Envoie moi ton prénom par message 🔽\n\`(exemple: Leo)\``)
        if (!firstName) return restoreForm(dmChannel)

        const lastName = await userResponseContent(dmChannel, `🔽 Envoie moi ton nom de famille par message 🔽\n\`(exemple: ROUSSARD)\``)
        if (!lastName) return restoreForm(dmChannel)

        const User = await mongoose.model('User').findOne({ discordId: interaction.user.id })
        if (User && User.id) {
            User.firstName = firstName,
            User.lastName = lastName.toUpperCase(),
            User.school = school,
            User.schoolYear = year ? year : undefined
            await User.save()

            dmChannel.send({
                embeds: [new MessageEmbed().setTitle('MERCI').setColor('00b894').setDescription(`Tes informations ont bien été enregistrées ✅\n\`\`\`PRENOM: ${firstName}\nNOM: ${lastName.toUpperCase()}\nECOLE: ${school.toUpperCase()}\nANNEE: ${year ? year.toUpperCase() : 'NON DEFINIE'}\`\`\``)]
            })
        }
    }
}


function restoreForm(dmChannel) {
    const componentRow = createButtonActionRow([
        createButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SUCCESS')
    ])
    const embed = new MessageEmbed()
        .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('#00b894')
    dmChannel.send({
        embeds: [embed],
        components: [componentRow]
    })
}