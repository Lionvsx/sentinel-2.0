const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const mongoose = require('mongoose');
const { updateGuildMemberCache } = require('../../../utils/functions/utilitaryFunctions');
const { isMember } = require('../../../utils/functions/dbFunctions');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const { createButtonActionRow, createButton } = require('../../../utils/functions/messageComponents')

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
                    interaction.reply(`**ℹ️ | **\`\`${user}\`\` est déjà dans le Bureau`)
                } else {
                    if (!isMember(userDB)) {
                        await registerMember(guildMember, userDB)
                    }
                    userDB.isBureau = true;
                    userDB.save();
                    await guildMember.roles.add(rolesToAdd)
                    client.allUsers.set(userDB.discordId, userDB);
                    interaction.reply(`**✅ | **\`\`${user}\`\` a bien été ajouté dans le Bureau !`)
                }
            } else {
                interaction.reply(`**❌ | **INTERNAL SERVER ERROR : DB CORRUPTION`)
            }
        } else {
            interaction.reply(`**❌ | **L'utilisateur ${user} est introuvable !`)
        }

    }
}

async function registerMember(member, dBUser) {
    const dmChannel = await member.createDM()

    const componentRow = createButtonActionRow([
        createButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SUCCESS')
    ])
    const embed = new MessageEmbed()
        .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('#00b894')
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