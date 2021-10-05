const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

module.exports = class RemoveUserButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonRemoveUser', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

    }
}