const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');

const { MessageEmbed, Permissions } = require('discord.js');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions');
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createButton, createSelectionMenuOption, createEmojiButton } = require('../../utils/functions/messageComponents')

module.exports = class TestCommand extends BaseCommand {
    constructor() {
        super('bureau', 'admin', [], {
            usage: "bureau <user>",
            description: "Ajoute un utilisateur en tant que membre du bureau",
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
                return message.channel.send(`**<:x_:1137419292946727042> | **Veuillez selectionner qu'un seul utilisateur à ajouter en tant que membre du bureau`)
            } else if (targetMembers.size === 1) {
                guildMember = targetMembers.first()
            }
        }

        if (guildMember) {
            const User = await mongoose.model('User').findOne({ discordId: guildMember.user.id });
            const rolesToAdd = allRoles.filter(role => (role.id === '624715133251223572' || role.id === '493708975313911838' || role.id === '743988023859085332') && !guildMember.roles.cache.has(role.id))
            if (User && User.id) {
                User.isBureau = true;
                User.save();
                await guildMember.roles.add(rolesToAdd)
                await registerMember(guildMember, User)
                message.channel.send(`**<:check:1137390614296678421> | **\`\`${guildMember.user.username}\`\` a bien été ajouté en tant que membre du bureau !`)
            } else {
                message.channel.send(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            message.channel.send(`**<:x_:1137419292946727042> | **Utilisateur introuvable !`)
        }
    }
}

async function registerMember(member, dBUser) {
    const dmChannel = await member.createDM()

    const componentRow = createButtonActionRow([
        createEmojiButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SUCCESS', '<:checksquare:1137390612543459398>')
    ])
    const embed = new MessageEmbed()
        .setTitle(`\` BIENVENUE CHEZ LDV ESPORT \``)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('#2b2d31')
    try {
        dmChannel.send({
            embeds: [embed],
            components: [componentRow]
        })
        if (dBUser && dBUser.id) {
            dBUser.isMember = true;
            await dBUser.save();
        } else {
            await User.create({
                username: member.user.username,
                discordId: member.user.id,
                userTag: member.user.tag,
                avatarURL: member.user.displayAvatarURL(),
                onServer: true,
                isMember: true
            })
        }
    } catch (err) {
        console.log(err)
    }
}