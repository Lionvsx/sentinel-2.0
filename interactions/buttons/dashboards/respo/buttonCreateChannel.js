const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const { createSelectionMenu, createSelectionMenuOption, createMessageActionRow} = require('../../../../utils/functions/messageComponents')
const { getEmoji } = require('../../../../utils/functions/utilitaryFunctions')


module.exports = class CreateChannelButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonCreateChannel', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const dmChannel = interaction.user.createDM().catch(err => console.log(err))


        let typeEmbed = new MessageEmbed()
            .setDescription(`Bonjour ${interaction.user.username}, \nQuel type de channel voulez vous créer?`)

        const selectionMenuComponent = createSelectionMenu('selectionCreateChannelMenu', 'Veuillez sélectionner un type de channel', [
            createSelectionMenuOption('GUILD_TEXT', 'Channel Textuel', undefined, '💬'),
            createSelectionMenuOption('GUILD_VOICE', 'Channel Vocal', undefined, '🔊'),
            createSelectionMenuOption('CANCEL', 'Annulez la commande', undefined, '❌')
        ], 1, 1)
        const selectionMenuMessage = await dmChannel.send({
            embeds: [typeEmbed],
            components: [createMessageActionRow([selectionMenuComponent])]
        })

        const selectionMenuInteraction = await menuInteraction(selectionMenuMessage).catch(err => console.log(err))
        if (!selectionMenuInteraction) return;

        if (selectionMenuInteraction.values[0] === 'CANCEL') return selectionMenuInteraction.update({
            embeds: [new MessageEmbed().setDescription(`**❌ | **Commande annulée`)],
            component: []
        })

        const channelName = await userResponseContent(dmChannel, `Quel nom voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelName) return;
        const channelEmoji = await userResponseContent(dmChannel, `Quel emoji voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelEmoji) return;

        const emoji = getEmoji(channelEmoji)
        if (!emoji) return dmChannel.send(`**❌ | **Emoji non valide !`)

           


    }
}