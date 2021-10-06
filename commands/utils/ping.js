const { MessageEmbed } = require('discord.js')
const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class PingCommand extends BaseCommand {
    constructor() {
        super('ping', 'utilities', [], {
            usage: "ping",
            description: "Ping le bot",
            categoryDisplayName: `🔧 Utilities`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            admin: false,
            home: false,
            serverOnly: false,
            subCommands: false
        })
    }

    async run(client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        let msg = await message.channel.send(`**${loading} | **Pinging server ...`)
        let embed = new MessageEmbed()
            .setColor('#2ecc71')
        msg.edit({
            content: ' ',
            embeds: [embed.addFields([
                {name: 'Ping', value: `\`${msg.createdTimestamp - message.createdTimestamp} ms\``, inline: true},
                {name: 'API Latency', value: `\`${Math.round(client.ws.ping)} ms\``, inline: true}
            ])]
        })
    }
}