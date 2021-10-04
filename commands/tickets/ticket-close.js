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
            subCommands: false
        });
    }

    async run(client, message, args) {
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {
            existingDBTicket.archive = true
            await existingDBTicket.save();

            let dmUser = message.guild.members.cache.get(existingDBTicket.userId);
            dmUser.createDM().then(dmChannel => {
                dmChannel.send(`**✅ | **Votre problème a été marqué comme résolu par \`\`${message.author.username}\`\`, si ce n'est pas le cas veuillez simplement renvoyer un message ci dessous !`)
            })
            await mongoose.model('Ticket').deleteOne({ linkedChannelId: message.channel.id })
            let deleteEmbed = new MessageEmbed()
                .setDescription("Suppression du ticket dans 5 secondes...")
                .setColor('ff5733')
            message.channel.send(deleteEmbed);
            await sleep(5000);
            message.channel.delete();
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}