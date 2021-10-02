const BaseEvent = require('../../utils/structures/BaseEvent');
const mongoose = require('mongoose')

module.exports = class MessageEvent extends BaseEvent {
    constructor() {
        super('message')
    }

    async run(client, message) {
        if (message.author.bot) return
        if (!message.guild) return
        const guildConfig = client.config.get(message.guild.id);
        const prefix = guildConfig.prefix
        const allMembers = message.guild.members.cache
        let args = message.content.split(' ');

        if (!message.mentions.has(allMembers.get(client.user.id)) && !message.content.startsWith(prefix)) return;
        
        let command
        if (message.mentions.has(allMembers.get(client.user.id)) || args[0].toLowerCase() === 'sentinel' || args[0].toLowerCase() === 'forum' || args[0].toLowerCase() === 'fa') {
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
            
            const User = await mongoose.model('User').findOne({ discordId: message.author.id })
            if (!allMembers.get(message.author.id).hasPermission(command.help.userPermissions)) return message.channel.send(`**:x: | **Vous n'avez pas la permission pour executer cette commande !`)
            if (command.help.admin === true && User && User.isAdmin === false) return message.channel.send(`**:x: | **Seul les administrateurs peuvent exécuter cette commande !`)
            command.run(client, message, args);
        }

    }
}