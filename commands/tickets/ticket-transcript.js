const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions } = require('discord.js');
const mongoose = require('mongoose')

const {createTicketTranscript} = require('../../utils/functions/createTicketTranscript')

module.exports = class TicketTranscriptCommand extends BaseCommand {
    constructor() {
        super('ticket-transcript', 'tickets', [], {
            usage: 'ticket transcript',
            description: `Envoie un transcript html du ticket`,
            categoryDisplayName: `🎫 Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: false,
            subCommands: false
        });
    }

    async run(client, message, args) {
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id })
        if (existingDBTicket && existingDBTicket.id) {
            let ticketMember = message.guild.members.cache.get(existingDBTicket.userId)
            if (!ticketMember) return;
            let fileName = await createTicketTranscript(ticketMember.user.username.toLowerCase(), existingDBTicket.dmChannelId, message.guild.id)
            let transcript = new Discord.MessageAttachment(`./files/transcripts/${fileName}`, fileName)
            let sendedMessage = await message.channel.send(transcript)
            let sendedAttachment = (sendedMessage.attachments).array()[0]

            let embed = new MessageEmbed()
                .setDescription(`**${ticketMember.user.tag}**`)
                .addFields(
                    { name: "Auteur du ticket", value: ticketMember.user.tag, inline: true },
                    { name: "Channel du ticket", value: message.channel.name, inline: true },
                    { name: "Lien du transcript", value: `[Link](${sendedAttachment.url})`, inline: true },
                )
                .setColor('#f1c40f')
            message.channel.send(embed)
                
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
