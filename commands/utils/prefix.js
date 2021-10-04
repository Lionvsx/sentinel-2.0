const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');
const { Permissions } = require('discord.js');

module.exports = class PrefixCommand extends BaseCommand {
    constructor () {
        super('prefix', 'utilities', [], {
            usage: "prefix",
            description: "Affiche/Change le prefix du bot",
            categoryDisplayName: `🔧 Utilities`,
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
        if(!args[1]) message.channel.send(`**ℹ | **Le prefix actuel est défini sur : \`${guildConfig.prefix}\``)
        else {
            mongoose.model('Guild').updateOne({ guildId: message.guild.id }, { prefix: args[1]}, {}, async (err) => {
                if (err) throw err && message.channel.send(`**❌ | **Une erreur est survenue lors du changement de prefix !`)
                else message.channel.send(`**✅ | **Le nouveau prefix est : \`${args[1]}\``)
            })
            guildConfig.prefix = args[1];
            client.config.set(message.guild.id, guildConfig);
        }
    }
}