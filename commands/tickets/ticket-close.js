const BaseCommand = require('../../utils/structures/BaseCommand')
const { MessageEmbed, Permissions, MessageAttachment } = require('discord.js');
const mongoose = require('mongoose');
const { createTicketTranscript } = require('../../utils/functions/createTicketTranscript');
const DiscordLogger = require('../../utils/services/discordLoggerService');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TicketCloseCommand extends BaseCommand {
    constructor() {
        super('ticket-close', 'tickets', [], {
            usage: 'ticket close',
            description: `Ferme le ticket et le marque comme terminé.`,
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
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
        const existingDBTicket = await mongoose.model('Ticket').findOne({ ticketChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {

            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            let deleteEmbed = new MessageEmbed()
                .setDescription("<:trash:1137390663797841991> Suppression du ticket dans 5 secondes...")
                .setColor('#2b2d31')
            message.channel.send({
                embeds: [deleteEmbed]
            });

            const allMembers = await updateGuildMemberCache(message.guild)
            let ticketMember = await allMembers.get(existingDBTicket.authorId)

            let ticketUsername = ticketMember ? ticketMember.user.username.toLowerCase() : "DeletedUser"
            let tickerUserTag = ticketMember ? ticketMember.user.tag : "DeletedUser#0000"

            const archiveChannel = message.guild.channels.cache.get('632219616973815827')
            let fileName = await createTicketTranscript(client, ticketUsername, existingDBTicket.ticketChannelId, message.guild.id)
            let sendedMessage = await archiveChannel.send({ files: [
                {
                    attachment: `./files/transcripts/${fileName}`,
                    name: fileName
                }
            ]})

            let sendedAttachment = sendedMessage.attachments.first()

            let embed = new MessageEmbed()
                .setDescription(`\` ${tickerUserTag} \``)
                .addFields(
                    { name: "Auteur du ticket", value: tickerUserTag, inline: true },
                    { name: "Channel du ticket", value: existingDBTicket.name, inline: true },
                    { name: "Lien du transcript", value: `[Link](${sendedAttachment.url})`, inline: true },
                )
                .setColor('#2b2d31')
            archiveChannel.send({
                embeds: [embed]
            })

            await sleep(5000);
            existingDBTicket.archive = true
            await existingDBTicket.save();
            client.allTickets.delete(message.channel.id)
            ticketLogger.info(`Le ticket \`${existingDBTicket.name}\` a été supprimé par <@!${message.author.id}>`)
            message.channel.delete();
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}