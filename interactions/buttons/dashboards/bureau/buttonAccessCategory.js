const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

module.exports = class AccessCategoryButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonAccessCategory', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })

    }
}