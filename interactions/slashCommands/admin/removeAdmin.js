const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const Users = require("../../../src/schemas/UserSchema");

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
        let userDB = await Users.findOne({ discordId: interaction.user.id, onServer: true });
        if (!userDB.isAdmin) return interaction.reply(`**<:x_:1137419292946727042> | **Vous n'avez pas la permission d'executer cette commande`)

        if (guildMember) {
            if (userDB && userDB.id) {
                if (userDB.isAdmin) {
                    userDB.isAdmin = false;
                    userDB.save();
                    client.allUsers.set(userDB.discordId, userDB);
                    interaction.reply(`**<:check:1137390614296678421> | **\`\`${user}\`\` a bien été retiré des administrateurs du bot`)
                } else {
                    interaction.reply(`**<:info:1137425479914242178> | **\`\`${user}\`\` n'est pas administrateur du bot`)
                }
            } else {
                interaction.reply(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**<:x_:1137419292946727042> | **L'utilisateur ${user} est introuvable !`)
        }

    }
}