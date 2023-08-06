const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class MessageCreateEvent extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (message.author.bot) return
        if (!message.guild) return
        if (message.partial) message = await message.fetch()

        const prefix = client.config.get(message.guild.id).prefix;
        const allMembers = message.guild.members.cache
        let args = message.content.split(' ');

        if (!message.mentions.has(allMembers.get(client.user.id)) && !message.content.startsWith(prefix)) return;
        
        let command
        if (message.mentions.has(allMembers.get(client.user.id))) {
            args.shift()
            command = await client.commands.get(args[0].toLowerCase())
            if (!command) {
                let cmdalias = await client.aliases.get(args[0].toLowerCase())
                if (cmdalias) {
                    command = cmdalias
                }
            }

        } else {
            command = await client.commands.get(args[0].toLowerCase().slice(prefix.length));
            args[0] = args[0].slice(prefix.length)
            if (!command) {
                let cmdalias = await client.aliases.get(args[0].toLowerCase())
                if (cmdalias) {
                    command = cmdalias
                }
            }
        }

        if (command) {
            if (command.help.subCommands === true && args[1]) {
                let subCommand = client.commands.get(`${args[0]}-${args[1]}`);
                if (subCommand) {
                    command = subCommand;
                }
            }

            if (command.help.home === true && message.guild.id !== '227470914114158592') return message.channel.send(`**<:x_:1137419292946727042> | **Cette commande est réservée uniquement au serveur \`\`LDV Esport\`\` !`)
            const User = client.allUsers.get(message.author.id)
            if (!allMembers.get(message.author.id).permissions.has(command.help.userPermissions)) return message.channel.send(`**<:x_:1137419292946727042> | **Vous n'avez pas la permission pour executer cette commande !`)
            if (!allMembers.get(client.user.id).permissions.has(command.help.clientPermissions)) return message.channel.send(`**<:x_:1137419292946727042> | **Je n'ai pas la permission pour executer cette commande !`)
            if (command.help.admin === true && User && User.isAdmin === false) return message.channel.send(`**<:x_:1137419292946727042> | **Seul les administrateurs peuvent exécuter cette commande !`)
            command.run(client, message, args);
        }

    }
}