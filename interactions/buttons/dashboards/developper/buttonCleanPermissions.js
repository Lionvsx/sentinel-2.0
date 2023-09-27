const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const {Permissions} = require("discord.js");
const DiscordLogger = require("../../../../utils/services/discordLoggerService");

module.exports = class ButtonCleanPermissions extends BaseInteraction {
    constructor() {
        super('buttonCleanPermissions', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [Permissions.FLAGS.ADMINISTRATOR]
        });
    }

    async run(client, interaction, options) {
        const loading = client.emojis.cache.get('741276138319380583')
        await interaction.reply({
            content: `**${loading} | **Nettoyage des permissions...`,
            ephemeral: true
        })
        const allChannels = interaction.guild.channels.cache.filter(c => !c.parent?.name.toLowerCase().includes('ticket'));
        const allMembers = interaction.guild.members.cache;
        const envLogger = new DiscordLogger('environnement', '#00cec9')
        envLogger.setGuild(interaction.guild)
        envLogger.setLogMember(interaction.member)

        for (const [, channel] of allChannels.entries()) {
            if (!channel.permissionOverwrites) {
                this.warn(`Channel ${channel.name} has no permission overwrites`)
                continue;
            }
            for (const [, permission] of channel.permissionOverwrites.cache.entries()) {
                if (permission.type === 'member') {
                    try {
                        await permission.delete();
                        this.log(`Cleared permissions for user ${allMembers.get(permission.id).user.username} in ${channel.name}`);
                        await envLogger.info(`Cleared permissions for user \` ${allMembers.get(permission.id).user.username} \` in ${channel.name}`);
                    } catch (error) {
                        this.error(`Failed to clear permissions for user ${allMembers(permission.id).user.username} in ${channel.name}`);
                    }
                }
            }
        }

        await interaction.editReply({
            content: `**<:check:1137390614296678421> | **Les permissions ont été nettoyées !`,
        })
    }
}
