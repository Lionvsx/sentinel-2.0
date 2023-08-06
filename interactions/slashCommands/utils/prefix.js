const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('prefix', 'utilities', 'slashCommand', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('prefix')
                .setDescription('Change le préfixe de Sentinel')
                .addStringOption(option =>
                    option.setName('prefix')
                        .setDescription('Nouveau préfixe')
                        .setRequired(false)
                    )
        })
    }

    async run(client, interaction) {
        const guildId = interaction.guild.id
        const guildConfig = client.config.get(guildId)
        const prefix = guildConfig.prefix
        const prefixOpt = interaction.options.get('prefix')

        if (!prefixOpt) {
            interaction.reply(`**<:info:1137425479914242178> | **Le prefix actuel est défini sur : \`${prefix}\``)
        } else {
            mongoose.model('Guild').updateOne({ guildId: guildId }, { prefix: prefixOpt.value}, {}, async (err) => {
                if (err) throw err && interaction.reply(`**<:x_:1137419292946727042> | **Une erreur est survenue lors du changement de prefix !`)
                else interaction.reply(`**<:check:1137390614296678421> | **Le nouveau prefix est : \`${prefixOpt.value}\``)
            })
            guildConfig.prefix = prefixOpt.value;
            client.config.set(guildId, guildConfig);
        }
    }
}