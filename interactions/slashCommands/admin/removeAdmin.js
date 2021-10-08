const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('deop', 'admin', 'slashCommand', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('deop')
                .setDescription('Retire un utilisateur des admins bot')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Administrateur')
                        .setRequired(true)
                    )
        })
    }

    async run(client, interaction) {
        const guild = interaction.guild
        const allMembers = await updateGuildMemberCache(guild)
        const user = interaction.options.get('user').user.username

        let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(user.toLowerCase()));

        if (guildMember) {
            const userId = guildMember.user.id;
            const userDB = await mongoose.model('User').findOne({ discordId: userId });
            console.log(userDB, userId)
            if (userDB && userDB.id) {
                if (userDB.isAdmin) {
                    userDB.isAdmin = false;
                    userDB.save();
                    interaction.reply(`**✅ | **\`\`${user}\`\` a bien été retiré des administrateurs du bot`)
                } else {
                    interaction.reply(`**❎ | **\`\`${user}\`\` n'est pas administrateur du bot`)
                }
            } else {
                interaction.reply(`**❌ | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**❌ | **L'utilisateur ${user} est introuvable !`)
        }

    }
}