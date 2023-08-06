const BaseCommand = require('../../utils/structures/BaseCommand')
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');
const DiscordLogger = require('../../utils/services/discordLoggerService');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TicketRemoveCommand extends BaseCommand {
    constructor() {
        super('ticket-remove', 'tickets', [], {
            usage: 'ticket remove <user(s)>',
            description: `Retire un ou des utilisateur(s) à ce ticket`,
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [],
            examples: ["ticket remove Lionvsx, Ominga|Retire Lionvsx et Ominga au ticket !"],
            serverOnly: true,
            admin: false,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {
            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            const allMembers = await updateGuildMemberCache(message.guild);

            if (args[1] === 'remove') args.splice(0, 2)
            else args.splice(0, 1)
            let memberToString = args.join(' ')
            let membersToRemoveArray = memberToString.split(', ')
            message.mentions.members ? message.mentions.members.each(member => membersToRemoveArray.push(member.user.tag)) : null
            let count = 0
            let errors = 0
            let tempMsg = await message.channel.send(`**${loading} |** Retrait en cours ...`)
            let removedMembersArray = []
            for (let i = 0; i < membersToRemoveArray.length; i++) {
                let memberString = membersToRemoveArray[i];
                let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(memberString.toLowerCase()));
                if (!guildMember) {
                    errors++
                    continue
                }
                await message.channel.permissionOverwrites.delete(guildMember.user.id)
                    .then(channel => {
                        removedMembersArray.push(guildMember.user.tag)
                        count++;
                        ticketLogger.info(`<@!${message.author.id}> a retiré \`${guildMember.user.username}\` du ticket \`${existingDBTicket.name}\``)
                    })
                    .catch(err => {
                        console.error(err)
                        ticketLogger.setLogData(err)
                        ticketLogger.error(`<@!${message.author.id}> n'est pas arrivé à retirer \`${guildMember.user.username}\` du ticket \`${existingDBTicket.name}\``)
                        errors++;
                    })
            }
            count === 0 ? tempMsg.edit(`**<:x_:1137419292946727042> | **Je ne suis pas arrivé à retirer le(s) utilisateur(s) du ticket !`) : errors > 1 ? tempMsg.edit(`**<:alerttriangleyellow:1137390607069888593> | **Je suis seulement arrivé à retirer le(s) utilisateur(s) suivant(s) du ticket : \`\`${removedMembersArray.join(', ')}\`\``) : tempMsg.edit(`**<:check:1137390614296678421> | **J'ai retiré le(s) utilisateur(s) suivant(s) du ticket : \`\`${removedMembersArray.join(', ')}\`\``)
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
