const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

module.exports = class DeleteChannelButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonDeleteChannel', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

    }
}