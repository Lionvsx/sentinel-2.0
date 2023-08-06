const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('op', 'admin', 'slashCommand', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('op')
                .setDescription('Ajoute un utilisateur en tant qu\'admin bot')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Nouvel administrateur')
                        .setRequired(true)
                    )
        })
    }

    async run(client, interaction) {
        const guild = interaction.guild
        const allMembers = await updateGuildMemberCache(guild)
        const user = interaction.options.get('user').user.tag

        let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(user.toLowerCase()));

        if (guildMember) {
            const userId = guildMember.user.id;
            const userDB = await mongoose.model('User').findOne({ discordId: userId, onServer: true });
            if (userDB && userDB.id) {
                if (userDB.isAdmin) {
                    interaction.reply(`**<:info:1137425479914242178> | **\`\`${user}\`\` est déjà administrateur du bot`)
                } else {
                    userDB.isAdmin = true;
                    userDB.save();
                    client.allUsers.set(userDB.discordId, userDB);
                    interaction.reply(`**<:check:1137390614296678421> | **\`\`${user}\`\` a bien été ajouté aux administrateurs du bot`)
                }
            } else {
                interaction.reply(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**<:x_:1137419292946727042> | **L'utilisateur ${user} est introuvable !`)
        }

    }
}