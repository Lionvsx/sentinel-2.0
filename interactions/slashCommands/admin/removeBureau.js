const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('bureau-remove', 'admin', 'slashCommand', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('bureau-remove')
                .setDescription('Retire un utilisateur du bureau')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Ancien membre du bureau')
                        .setRequired(true)
                    )
        })
    }

    async run(client, interaction) {
        const guild = interaction.guild
        const allMembers = await updateGuildMemberCache(guild)
        const user = interaction.options.get('user').user.username
        const allRoles = guild.roles.cache

        let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(user.toLowerCase()));

        if (guildMember) {
            const userId = guildMember.user.id;
            const userDB = await mongoose.model('User').findOne({ discordId: userId, onServer: true });

            let rolesToRemove = allRoles.filter(role => role.id === '493708975313911838')
            if (!userDB.isResponsable) {
                rolesToRemove = rolesToRemove.concat(allRoles.filter(role => role.id === '624715133251223572' || role.id === '743988023859085332'))
            }

            if (userDB && userDB.id) {
                if (userDB.isBureau) {
                    userDB.isBureau = false;
                    userDB.save();
                    await guildMember.roles.remove(rolesToRemove)
                    client.allUsers.set(userDB.discordId, userDB);
                    interaction.reply(`**✅ | **\`\`${user}\`\` a bien été retiré du Bureau !`)
                } else {
                    interaction.reply(`**ℹ️ | **\`\`${user}\`\` n'est pas dans le Bureau`)
                }
            } else {
                interaction.reply(`**❌ | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**❌ | **L'utilisateur ${user} est introuvable !`)
        }

    }
}