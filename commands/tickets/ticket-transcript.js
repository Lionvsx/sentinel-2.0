const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions, MessageAttachment } = require('discord.js');
const mongoose = require('mongoose')

const { createTicketTranscript } = require('../../utils/functions/createTicketTranscript')

const DiscordLogger = require('../../utils/services/discordLoggerService');

module.exports = class TicketTranscriptCommand extends BaseCommand {
    constructor() {
        super('ticket-transcript', 'tickets', [], {
            usage: 'ticket transcript',
            description: `Envoie un transcript html du ticket`,
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: false,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {
        const existingDBTicket = await mongoose.model('Ticket').findOne({ ticketChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {
            let ticketMember = await message.guild.members.fetch(existingDBTicket.authorId)
            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            if (!ticketMember) return;
            let fileName = await createTicketTranscript(client, ticketMember.user.username.toLowerCase(), existingDBTicket.ticketChannelId, message.guild.id)
            let sendedMessage = await message.channel.send({ files: [
                {
                    attachment: `./files/transcripts/${fileName}`,
                    name: fileName
                }
            ]})

            let sendedAttachment = sendedMessage.attachments.first()

            let embed = new MessageEmbed()
                .setDescription(`\` ${ticketMember.user.tag} \``)
                .addFields(
                    { name: "Auteur du ticket", value: ticketMember.user.tag, inline: true },
                    { name: "Channel du ticket", value: message.channel.name, inline: true },
                    { name: "Lien du transcript", value: `[Link](${sendedAttachment.url})`, inline: true },
                )
                .setColor('#2b2d31')
            message.channel.send({
                embeds: [embed]
            })
            ticketLogger.info(`<@!${message.author.id}> a crée un transcript pour le ticket \`${existingDBTicket.name}\``)
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}