const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const Users = require("../../../src/schemas/UserSchema");

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('bureau-remove', 'admin', 'slashCommand', {
            userPermissions: [],
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
        let userDB = await Users.findOne({ discordId: interaction.user.id, onServer: true });
        if (!userDB.isBureau) return interaction.reply(`**<:x_:1137419292946727042> | **Vous n'avez pas la permission d'executer cette commande`)

        if (guildMember) {
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
                    interaction.reply(`**<:check:1137390614296678421> | **\`\`${user}\`\` a bien été retiré du Bureau !`)
                } else {
                    interaction.reply(`**<:info:1137425479914242178> | **\`\`${user}\`\` n'est pas dans le Bureau`)
                }
            } else {
                interaction.reply(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**<:x_:1137419292946727042> | **L'utilisateur ${user} est introuvable !`)
        }

    }
}