const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');
const { Permissions } = require('discord.js');

module.exports = class PrefixCommand extends BaseCommand {
    constructor () {
        super('prefix', 'utilities', [], {
            usage: "prefix",
            description: "Affiche/Change le prefix du bot",
            categoryDisplayName: `<:tool:1137412707629412453> Utilities`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: ['prefix|Affiche le prefix', "prefix !|Change le prefix en !"],
            serverOnly: false,
            admin: false,
            subCommands: false,
            home: false,
        });
    }

    async run (client, message, args) {
        const guildConfig = client.config.get(message.guild.id)
        if(!args[1]) message.channel.send(`**<:info:1137425479914242178> | **Le prefix actuel est défini sur : \`${guildConfig.prefix}\``)
        else {
            mongoose.model('Guild').updateOne({ guildId: message.guild.id }, { prefix: args[1]}, {}, async (err) => {
                if (err) throw err && message.channel.send(`**<:x_:1137419292946727042> | **Une erreur est survenue lors du changement de prefix !`)
                else message.channel.send(`**<:check:1137390614296678421> | **Le nouveau prefix est : \`${args[1]}\``)
            })
            guildConfig.prefix = args[1];
            client.config.set(message.guild.id, guildConfig);
        }
    }
}