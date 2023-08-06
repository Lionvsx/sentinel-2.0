const { Permissions } = require('discord.js');
const { sleep } = require('../../utils/functions/utilitaryFunctions');
const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class NukeChannelCommand extends BaseCommand {
    constructor () {
        super('nuke', 'config', [], {
            usage: "nuke",
            description: "Nuke le channel textuel dans lequel vous lancez la commande",
            categoryDisplayName: `<:settings:1137410884432564404> Config`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (bot, message, args) {
        const loading = bot.emojis.cache.get('741276138319380583')

        message.channel.send(`**${loading} |** Nuke du channel dans 5 secondes`)
        await sleep(5000)

        if (message.channel.type !== 'GUILD_TEXT') return message.channel.send(`**<:x_:1137419292946727042> |** Ce channel ne peut pas être nuke !`)

        let channelOptions = {
            type: 'GUILD_TEXT',
            topic: message.channel.topic,
            nsfw: message.channel.nsfw,
            bitrate: message.channel.bitrate,
            parent: message.channel.parent,
            permissionOverwrites: message.channel.permissionOverwrites.cache,
            position: message.channel.position,
            rateLimitPerUser: message.channel.rateLimitPerUser,
            reason: 'Sentinel Channel Nuke'
        }
        let channelName = message.channel.name
        message.channel.delete()

        message.guild.channels.create(channelName, channelOptions).then(newChannel => {
            newChannel.setPosition(channelOptions.position)
            newChannel.send(`**<:check:1137390614296678421> |** Channel nuked!`)
        })
    }
}


