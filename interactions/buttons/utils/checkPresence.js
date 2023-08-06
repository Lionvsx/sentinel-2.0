const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { menuInteraction, userResponseContent } = require('../../../utils/functions/awaitFunctions')
const { MessageEmbed, MessageButton } = require('discord.js')
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createButton, createSelectionMenuOption, createEmojiButton } = require('../../../utils/functions/messageComponents')
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
                embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> Ce relevé de présence a été cloturé**`).setColor('2b2d31')],
                components: []
            })
        } else if (Presence?.running === true) { 
            if (Presence.open === true) {
                const User = await mongoose.model('User').findOne({ discordId: interaction.user.id })
                if (!isMember(User)) {
                    await interaction.reply({
                        content: `**<:alerttriangleyellow:1137390607069888593> Tu ne peux pas t'enregistrer présent tant que tu n'as rempli les informations requises !**\n<:arrowdown:1137420436016214058> Voici le formulaire à remplir <:arrowdown:1137420436016214058>`
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
                    content: `**<:x_:1137419292946727042> L'appel est fermé !**`
                })
            }
        }
    }
}

function restoreForm(dmChannel) {
    const componentRow = createButtonActionRow([
        createEmojiButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SECONDARY', '<:checksquare:1137390612543459398>')
    ])
    const embed = new MessageEmbed()
        .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurions besoin de quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('2b2d31')
    dmChannel.send({
        embeds: [embed],
        components: [componentRow]
    })
}