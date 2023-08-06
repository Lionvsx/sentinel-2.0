const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { isMember } = require('../../../utils/functions/dbFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { createButtonActionRow, createButton, createEmojiButton } = require('../../../utils/functions/messageComponents')

module.exports = class PrefixInteraction extends BaseInteraction {
    constructor() {
        super('bureau-add', 'admin', 'slashCommand', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('bureau-add')
                .setDescription('Ajoute un utilisateur en tant que membre du bureau')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Nouveau membre du bureau')
                        .setRequired(true)
                    )
        })
    }

    async run(client, interaction) {
        const guild = interaction.guild
        const allMembers = await updateGuildMemberCache(guild)
        const user = interaction.options.get('user').user.tag
        const allRoles = guild.roles.cache

        let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(user.toLowerCase()));

        if (guildMember) {
            const userId = guildMember.user.id;
            const userDB = await mongoose.model('User').findOne({ discordId: userId, onServer: true });
            const rolesToAdd = allRoles.filter(role => (role.id === '624715133251223572' || role.id === '493708975313911838' || role.id === '743988023859085332') && !guildMember.roles.cache.has(role.id))
            if (userDB && userDB.id) {
                if (userDB.isBureau) {
                    interaction.reply(`**<:info:1137425479914242178> | **\`\`${user}\`\` est déjà dans le Bureau`)
                } else {
                    if (!isMember(userDB)) {
                        await registerMember(guildMember, userDB)
                    }
                    userDB.isBureau = true;
                    userDB.save();
                    await guildMember.roles.add(rolesToAdd)
                    client.allUsers.set(userDB.discordId, userDB);
                    interaction.reply(`**<:check:1137390614296678421> | **\`\`${user}\`\` a bien été ajouté dans le Bureau !`)
                }
            } else {
                interaction.reply(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**<:x_:1137419292946727042> | **L'utilisateur ${user} est introuvable !`)
        }

    }
}

async function registerMember(member, dBUser) {
    const dmChannel = await member.createDM()

    const componentRow = createButtonActionRow([
        createEmojiButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SECONDARY', '<:checksquare:1137390612543459398>')
    ])
    const embed = new MessageEmbed()
        .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('2b2d31')
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