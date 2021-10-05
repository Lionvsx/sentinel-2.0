const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation, askYesOrNo, userResponseContent } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString } = require('../../../../utils/functions/utilitaryFunctions')
const { createButtonActionRow, createButton } = require('../../../../utils/functions/messageComponents')
const { MessageEmbed, Permissions } = require('discord.js')
const mongoose = require('mongoose')
const Ticket = require('../../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')

module.exports = class TicketTechniqueButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonTicketTechnique', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
 
    }
}

