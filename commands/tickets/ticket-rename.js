const BaseCommand = require('../../utils/structures/BaseCommand')
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');
const DiscordLogger = require('../../utils/services/discordLoggerService');
const { updateGuildMemberCache, getDivider, getEmoji } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TicketRenameCommand extends BaseCommand {
    constructor() {
        super('ticket-rename', 'tickets', [], {
            usage: 'ticket rename <nouveau nom>',
            description: `Renomme ce ticket`,
            categoryDisplayName: `🎫 Tickets`,
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
            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            if (args[1] === 'rename') args.splice(0, 2)
            else args.splice(0, 1)

            if (!args[1]) return message.channel.send(`**❌ | **Veuillez donner un nouveau nom pour le ticket !`)


            const emoji = getEmoji(message.channel.name)
            message.channel.setName(emoji + '┃' + args[1])
                .then(async (channel) => {
                    existingDBTicket.name = args[1];
                    await existingDBTicket.save()
                    
                    message.channel.send(`**✅ | **Ticket renommé en ${channel.name}`)

                    ticketLogger.info(`<@!${message.author.id}> a renommé le ticket \`${message.channel.name}\` en \`${channel.name}\``)
                })
                .catch(err => {
                    ticketLogger.setLogData(err)
                    ticketLogger.error(`<@!${message.author.id}> n'est pas arrivé à renommer le ticket \`${message.channel.name}\``)
                })
        }
    }
}
