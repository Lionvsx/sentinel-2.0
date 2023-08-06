const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class TicketCommand extends BaseCommand {
    constructor() {
        super('ticket', 'tickets', [], {
            usage: 'ticket <commands>',
            description: 'Opération sur les tickets',
            categoryDisplayName: `<:messagesquare:1137390645972049970> Tickets`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: false,
            subCommands: true,
            home: true,
            arguments: `\`commands\` : add, remove, close, exit, transcript`,
        });
    }

    async run(client, message, args) {
        message.channel.send(`**<:x_:1137419292946727042> | **Arguments invalides ! \`\`${client.config.get(message.guild.id).prefix}help ticket\`\` pour voir les arguments disponibles !`)
    }
}