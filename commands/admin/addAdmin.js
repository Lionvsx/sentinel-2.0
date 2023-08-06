const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');

const { Permissions } = require('discord.js');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createButton, createSelectionMenuOption } = require('../../utils/functions/messageComponents')

module.exports = class TestCommand extends BaseCommand {
    constructor() {
        super('op', 'admin', [], {
            usage: "op <user>",
            description: "Ajoute un utilisateur en tant qu'admin bot",
            categoryDisplayName: `<:triangle:1137394274816753695> Admin`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            admin: true,
            home: false,
            serverOnly: false,
            subCommands: false
        })
    }

    async run(client, message, args) {
        const allMembers = await updateGuildMemberCache(message.guild)
        const allRoles = message.guild.roles.cache

        let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()));
        if (!guildMember) {
            let targetMembers = message.mentions.members.filter(m => !m.user.bot)

            if (targetMembers.size === 0) {
                return message.channel.send(`**<:x_:1137419292946727042> | **Veuillez selectionner au moins un utilisateur !`)
            } else if (targetMembers.size > 1) {
                return message.channel.send(`**<:x_:1137419292946727042> | **Veuillez selectionner qu'un seul utilisateur à ajouter en tant qu'admin`)
            } else if (targetMembers.size === 1) {
                guildMember = targetMembers.first()
            }
        }

        if (guildMember) {
            const User = await mongoose.model('User').findOne({ discordId: guildMember.user.id });
            if (User && User.id) {
                User.isAdmin = true;
                User.save();
                message.channel.send(`**<:check:1137390614296678421> | **\`\`${guildMember.user.username}\`\` a bien été ajouté aux administrateurs du bot`)
            } else {
                message.channel.send(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Utilisateur introuvable !`)
        }
    }
}