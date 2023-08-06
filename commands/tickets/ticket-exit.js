const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions } = require('discord.js');
const mongoose = require('mongoose')
const DiscordLogger = require('../../utils/services/discordLoggerService')

module.exports = class TicketExitCommand extends BaseCommand {
    constructor() {
        super('ticket-exit', 'tickets', [], {
            usage: 'ticket exit',
            description: 'Quitte le ticket actuel',
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
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

            let quitEmbed = new MessageEmbed()
                .setDescription(`\`${message.author.username}\` a quitté le ticket' 👋`)
                .setColor('#2b2d31')
            try {
                message.channel.permissionOverwrites.delete(message.author.id)
                message.channel.send({
                    embeds: [quitEmbed]
                })
                message.author.createDM().then(dmChannel => dmChannel.send(`Vous avez quitté le ticket \`${message.channel.name}\``))
                ticketLogger.info(`<@${message.author.id}> a quitté le ticket \`${message.channel.name}\``)
                message.delete();
            } catch(err) {
                console.log(err)
                ticketLogger.error(`<@${message.author.id}> n'es pas arrivé à quitter le ticket \`${message.channel.name}\``)
            }
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
