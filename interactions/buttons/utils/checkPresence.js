const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { menuInteraction, userResponseContent } = require('../../../utils/functions/awaitFunctions')
const { MessageEmbed, MessageButton } = require('discord.js')
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createButton, createSelectionMenuOption } = require('../../../utils/functions/messageComponents')
const mongoose = require('mongoose');

const DiscordLogger = require('../../../utils/services/discordLoggerService');
const { getTime } = require('../../../utils/functions/systemFunctions');
const { isMember } = require('../../../utils/functions/dbFunctions');


module.exports = class PresenceCheckButton extends BaseInteraction {
    constructor() {
        super('checkPresence', 'utils', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return;
        const Presence = await mongoose.model('Presence').findById(buttonArgs[1], 'running open -_id').exec()
        if (!Presence?.running) {
            interaction.update({
                embeds: [new MessageEmbed().setDescription(`**❌ Ce relevé de présence a été cloturé**`).setColor('#c0392b')],
                components: []
            })
        } else if (Presence?.running === true) { 
            if (Presence.open === true) {
                const User = await mongoose.model('User').findOne({ discordId: interaction.user.id })
                if (!isMember(User)) {
                    await interaction.reply({
                        content: `**⚠ Tu ne peux pas t'enregistrer présent tant que tu n'as rempli les informations requises !**\n🔽 Voici le formulaire à remplir 🔽`
                    })
                    restoreForm(interaction.channel)
                } else {
                    mongoose.model('Presence').updateOne( { _id: buttonArgs[1] }, { $push: {memberCheck: User}}, {}, async (err, result) => {
                        if (err) throw err;
                        interaction.update({
                            components: [createMessageActionRow([
                                new MessageButton().setCustomId('disabledPresenceCheck').setDisabled(true).setLabel(`Noté présent à ${getTime()}`).setStyle('SUCCESS')
                            ])]
                        })
                    })
                }
            } else {
                interaction.reply({
                    content: `**❌ L'appel est fermé !**`
                })
            }
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