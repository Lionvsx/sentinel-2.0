const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');
const { Permissions } = require('discord.js')

const DiscordLogger = require('../../utils/services/discordLoggerService');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');

module.exports = class TicketAddCommand extends BaseCommand {
    constructor() {
        super('ticket-add', 'tickets', [], {
            usage: 'ticket add <user(s)>',
            description: `Ajoute un ou des utilisateur(s) à ce ticket`,
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [Permissions.FLAGS.MANAGE_CHANNELS],
            examples: ["ticket add Lionvsx, Ominga|Ajoute Lionvsx et Ominga au ticket !"],
            serverOnly: true,
            admin: false,
            subCommands: false,
            home: true
        });
    }

    async run(client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        const existingDBTicket = await mongoose.model('Ticket').findOne({ ticketChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {

            const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
            ticketLogger.setGuild(message.guild)
            ticketLogger.setLogMember(message.member)

            const allMembers = await updateGuildMemberCache(message.guild);
            if (args[1] === 'add') args.splice(0, 2)
            else args.splice(0, 1)
            let memberToString = args.join(' ')
            let memberToAddArray = memberToString.split(', ')
            message.mentions.members ? message.mentions.members.each(member => memberToAddArray.push(member.user.tag)) : null
            let count = 0
            let errors = 0
            let tempMsg = await message.channel.send(`**${loading} |** Ajout en cours ...`)
            let addedMembersArray = []
            for (let i = 0; i < memberToAddArray.length; i++) {
                let memberString = memberToAddArray[i];
                let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(memberString.toLowerCase()));
                if (!guildMember) {
                    errors++;
                    continue;
                }
                await message.channel.permissionOverwrites.create(guildMember.user, { VIEW_CHANNEL: true, SEND_MESSAGES: true })
                    .then(channel => {
                        addedMembersArray.push(guildMember.user.tag)
                        count++;
                        ticketLogger.info(`<@!${message.author.id}> a ajouté \`${guildMember.user.username}\` au ticket \`${existingDBTicket.name}\``)
                    })
                    .catch(err => {
                        console.error(err)
                        ticketLogger.setLogData(err)
                        ticketLogger.error(`<@!${message.author.id}> n'est pas arrivé à ajouter \`${guildMember.user.username}\` au ticket \`${existingDBTicket.name}\``)
                        errors++;
                    })
            }
            count === 0 ? tempMsg.edit(`**<:x_:1137419292946727042> | **Je ne suis pas arrivé à ajouter le(s) utilisateur(s) au ticket !`) : errors > 1 ? tempMsg.edit(`**<:alerttriangleyellow:1137390607069888593> | **Je suis seulement arrivé à ajouter le(s) utilisateur(s) suivant(s) au ticket : \`\`${addedMembersArray.join(', ')}\`\``) : tempMsg.edit(`**<:check:1137390614296678421> | **J'ai ajouté le(s) utilisateur(s) suivant(s) au ticket : \`\`${addedMembersArray.join(', ')}\`\``)
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
