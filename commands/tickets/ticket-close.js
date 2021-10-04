const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions } = require('discord.js');
const mongoose = require('mongoose')

module.exports = class TicketCloseCommand extends BaseCommand {
    constructor() {
        super('ticket-close', 'tickets', [], {
            usage: 'ticket close',
            description: `Ferme le ticket et le marque comme terminé.`,
            categoryDisplayName: `🎫 Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [Permissions.FLAGS.MANAGE_CHANNELS],
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
            existingDBTicket.archive = true
            await existingDBTicket.save();

            let deleteEmbed = new MessageEmbed()
                .setDescription("Suppression du ticket dans 5 secondes...")
                .setColor('ff5733')
            message.channel.send({
                embeds: [deleteEmbed]
            });
            await sleep(5000);
            client.allTickets.delete(message.channel.id)
            message.channel.delete();
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}