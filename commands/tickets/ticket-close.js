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
        const existingDBTicket = await mongoose.model('Ticket').findOne({ ticketChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {

            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

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
            ticketLogger.info(`Le ticket \`${existingDBTicket.name}\` a été supprimé par <@!${message.author.id}>`)
            message.channel.delete();


            const allMembers = await updateGuildMemberCache(message.guild)
            let ticketMember = await allMembers.get(existingDBTicket.authorId)
            if (!ticketMember) return;

            const archiveChannel = message.guild.channels.cache.get('632219616973815827')
            let fileName = await createTicketTranscript(client, ticketMember.user.username.toLowerCase(), existingDBTicket.dmChannelId, message.guild.id)
            let sendedMessage = await archiveChannel.send({ files: [
                {
                    attachment: `./files/transcripts/${fileName}`,
                    name: fileName
                }
            ]})

            let sendedAttachment = sendedMessage.attachments.first()

            let embed = new MessageEmbed()
                .setDescription(`**${ticketMember.user.tag}**`)
                .addFields(
                    { name: "Auteur du ticket", value: ticketMember.user.tag, inline: true },
                    { name: "Channel du ticket", value: existingDBTicket.name, inline: true },
                    { name: "Lien du trans cript", value: `[Link](${sendedAttachment.url})`, inline: true },
                )
                .setColor('#f1c40f')
            archiveChannel.send({
                embeds: [embed]
            })
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}