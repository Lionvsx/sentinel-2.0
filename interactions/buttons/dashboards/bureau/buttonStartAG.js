const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

module.exports = class StartAgButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonStartAG', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

    }
}