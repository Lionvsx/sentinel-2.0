const BaseCommand = require('../../utils/structures/BaseCommand')
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');
const DiscordLogger = require('../../utils/services/discordLoggerService');
const {getEmoji } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TicketRenameCommand extends BaseCommand {
    constructor() {
        super('ticket-rename', 'tickets', [], {
            usage: 'ticket rename <nouveau nom>',
            description: `Renomme ce ticket`,
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [],
            examples: ["ticket rename test|Renomme le ticket en test"],
            serverOnly: true,
            admin: false,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {
            let oldName = message.channel.name
            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            if (args[0] === 'ticket-rename') args.shift()
            else args.splice(0, 2)

            if (!args[0]) return message.channel.send(`**<:x_:1137419292946727042> | **Veuillez donner un nouveau nom pour le ticket !`)


            const emoji = getEmoji(message.channel.name)
            message.channel.setName(emoji + '┃' + args.join('-'))
                .then(async (channel) => {
                    existingDBTicket.name = args[1];
                    await existingDBTicket.save()
                    
                    message.channel.send(`**<:check:1137390614296678421> | **Ticket renommé en \`${channel.name}\``)

                    await ticketLogger.info(`<@!${message.author.id}> a renommé le ticket \`${oldName}\` en \`${channel.name}\``)
                })
                .catch(err => {
                    ticketLogger.setLogData(err)
                    ticketLogger.error(`<@!${message.author.id}> n'est pas arrivé à renommer le ticket \`${message.channel.name}\``)
                })
        }
    }
}
