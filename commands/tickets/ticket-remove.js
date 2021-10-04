const BaseCommand = require('../../utils/structures/BaseCommand')
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');

module.exports = class TicketRemoveCommand extends BaseCommand {
    constructor() {
        super('ticket-remove', 'tickets', [], {
            usage: 'ticket remove <user(s)>',
            description: `Retire un ou des utilisateur(s) à ce ticket`,
            categoryDisplayName: `🎫 Tickets`,
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            clientPermissions: [],
            examples: ["ticket remove Lionvsx, Ominga|Retire Lionvsx et Ominga au ticket !"],
            serverOnly: true,
            admin: false,
            subCommands: false
        });
    }

    async run(client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id })
        if (existingDBTicket && existingDBTicket.id) {
            args.splice(0, 2)
            let memberToString = args.join(' ')
            let membersToRemoveArray = memberToString.split(', ')
            message.mentions.members ? message.mentions.members.each(member => membersToRemoveArray.push(member.user.tag)) : null
            let count = 0
            let errors = 0
            let tempMsg = await message.channel.send(`**${loading} |** Ajout en cours ...`)
            let removedMembersArray = []
            for (let i = 0; i < membersToRemoveArray.length; i++) {
                let memberString = membersToRemoveArray[i];
                let guildMember = message.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(memberString.toLowerCase()));
                try {
                    let permissionsToRemove = message.channel.permissionOverwrites
                    permissionsToRemove.delete(guildMember.user.id)
                    message.channel.overwritePermissions(permissionsToRemove)
                    removedMembersArray.push(guildMember.user.tag)
                    count++;
                } catch (err) {
                    console.error(err)
                    errors++;
                }
            }
            count === 0 ? tempMsg.edit(`**❌ | **Je ne suis pas arrivé à retirer le(s) utilisateur(s) du ticket !`) : errors > 1 ? tempMsg.edit(`**⚠ | **Je suis seulement arrivé à retirer le(s) utilisateur(s) suivant(s) du ticket : \`\`${removedMembersArray.join(', ')}\`\``) : tempMsg.edit(`**✅ | **J'ai retiré le(s) utilisateur(s) suivant(s) du ticket : \`\`${removedMembersArray.join(', ')}\`\``)
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
