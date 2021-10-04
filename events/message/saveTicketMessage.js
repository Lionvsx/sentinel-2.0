const BaseEvent = require('../../utils/structures/BaseEvent');
const Ticket = require('../../src/schemas/TicketSchema')

module.exports = class MessageCreateEvent extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (message.author.bot) return
        if (!message.guild) return
        if (!client.allTickets.get(message.channel.id)) return

        const existingDBTicket = await Ticket.findOne({ dmChannelId: message.channel.id });
        if (existingDBTicket) {
            Ticket.updateOne( { ticketChannelId: message.channel.id }, { $push: {messages: {
                authorId: message.author.id,
                authorTag: message.author.tag,
                authorAvatarURL: message.author.displayAvatarURL(),
                createdAt: message.createdAt.toDateString(),
                content: message.content
            }}}, {}, async (err, result) => {
                if (err) throw err;
            })
        }

    }
}