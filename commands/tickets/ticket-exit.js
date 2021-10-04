const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions } = require('discord.js');
const mongoose = require('mongoose')

module.exports = class TicketExitCommand extends BaseCommand {
    constructor() {
        super('ticket-exit', 'tickets', [], {
            usage: 'ticket exit',
            description: 'Quitte le ticket actuel',
            categoryDisplayName: `🎫 Tickets`,
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
            let claimedUser = message.guild.members.cache.get(existingDBTicket.claimedByUserId)
            if (claimedUser && message.author.id === claimedUser.user.id) return message.channel.send(`**❌ | **Vous ne pouvez pas quitter un ticket qui vous est assigné !`)
            let quitEmbed = new MessageEmbed()
                .setDescription(`\`${message.author.username}\` a quitté le ticket' 👋`)
            try {
                let permissions = message.channel.permissionOverwrites
                permissions.delete(message.author.id)
                message.channel.overwritePermissions(permissions)
                message.channel.send({
                    embeds: [quitEmbed]
                })
                message.author.createDM().then(dmchannel => dmchannel.send(`Vous avez quitté le ticket \`${message.channel.name}\``))
            } catch(err) {
                console.log(err)
            }
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
