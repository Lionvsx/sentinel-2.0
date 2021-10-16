const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const { createButton } = require('../../../../utils/functions/messageComponents')

const mongoose = require('mongoose');

module.exports = class StartAgButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonManageAG', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allAssoMembers = await mongoose.model.find({ onServer: true, isMember: true })

        const dmChannel = await interaction.user.createDM().catch(err => console.log(err))

        const selectionEmbed = new MessageEmbed()
            .setDescription(`Bonjour \`${interaction.user.username}\`\nComment se déroulera l'assemblée générale? `)
            .addFields(
                { name: '🌐', value: "En ligne", inline: true },
                { name: '👥', value: "En présentiel", inline: true },
                { name: '❌', value: "Annuler la commande", inline: true },
            )
            .setColor('#9b59b6')

        const reactionSelector = await reactionEmbedSelector(dmChannel, ['🌐', '👥', '❌'], selectionEmbed).catch(err => console.log(err))
        if (!reactionSelector) return;

        if (reactionSelector.emoji === '🌐') {
            selectorReply(reactionSelector, '🌐', `En ligne`)
            
        } else if (reactionSelector.emoji === '👥') {
            selectorReply(reactionSelector, '👥', `En présentiel`)
        } else {
            selectorReply(reactionSelector, '❌', `Commande annulée`)
        }


    }
}