const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

module.exports = class AddUserButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonAddUser', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

    }
}