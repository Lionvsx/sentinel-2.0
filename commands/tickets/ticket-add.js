const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');
const { Permissions } = require('discord.js')

module.exports = class TicketAddCommand extends BaseCommand {
    constructor() {
        super('ticket-add', 'tickets', [], {
            usage: 'ticket add <user(s)>',
            description: `Ajoute un ou des utilisateur(s) à ce ticket`,
            categoryDisplayName: `🎫 Tickets`,
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
        const existingDBTicket = await mongoose.model('Ticket').findOne({ linkedChannelId: message.channel.id, archive: false })
        if (existingDBTicket && existingDBTicket.id) {
            args.splice(0, 2)
            let memberToString = args.join(' ')
            let memberToAddArray = memberToString.split(', ')
            message.mentions.members ? message.mentions.members.each(member => memberToAddArray.push(member.user.tag)) : null
            let count = 0
            let errors = 0
            let tempMsg = await message.channel.send(`**${loading} |** Ajout en cours ...`)
            let addedMembersArray = []
            for (let i = 0; i < memberToAddArray.length; i++) {
                let memberString = memberToAddArray[i];
                let guildMember = message.guild.members.cache.find(m => m.user.tag.toLowerCase().includes(memberString.toLowerCase()));
                try {
                    await message.channel.updateOverwrite(guildMember.user, { VIEW_CHANNEL: true })
                    addedMembersArray.push(guildMember.user.tag)
                    count++;
                } catch (err) {
                    console.error(err)
                    errors++;
                }
            }
            count === 0 ? tempMsg.edit(`**❌ | **Je ne suis pas arrivé à ajouter le(s) utilisateur(s) au ticket !`) : errors > 1 ? tempMsg.edit(`**⚠ | **Je suis seulement arrivé à ajouter le(s) utilisateur(s) suivant(s) au ticket : \`\`${addedMembersArray.join(', ')}\`\``) : tempMsg.edit(`**✅ | **J'ai ajouté le(s) utilisateur(s) suivant(s) au ticket : \`\`${addedMembersArray.join(', ')}\`\``)
        } else {
            message.channel.send(`**❌ | **Cette commande peut uniquement être utilisée dans un ticket !`)
        }
    }
}
