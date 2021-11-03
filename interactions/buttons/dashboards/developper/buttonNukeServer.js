const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { Permissions } = require('discord.js')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const mongoose = require('mongoose');

module.exports = class NukeServerButton extends BaseInteraction {
    constructor() {
        super('buttonNukeServer', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()

        const loading = client.emojis.cache.get('741276138319380583')

        const dmChannel = await interaction.user.createDM()

        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache

        const confirmation = await askForConfirmation(dmChannel, `Vous voulez vraiment reset tout les rôles des membres du serveur ${interaction.guild.name} ?`).catch(err => console.log(err))
        if (!confirmation) return;


        let msg = await dmChannel.send(`**${loading} | **Nuking members...`)
        let count = 0

        for (const [id, member] of allMembers.entries()) {
            if (member.bot) continue
            if (member.roles.cache.has('624705251966189588') || member.roles.cache.has('744660910861320242')) continue
    

            let roles = member.roles

            let rolesToRemove = roles.cache.filter(role => role.rawPosition < allRoles.get('742810872044322918').rawPosition && role.rawPosition > allRoles.get('624713487112732673').rawPosition || role.rawPosition < allRoles.get('676798588034220052').rawPosition && role.rawPosition > allRoles.get('677220059575222282').rawPosition)

            const User = await mongoose.model('User').findOne({ discordId: member.user.id })

            count++;

            if (User && User.id) {
                User.isMember = false
                User.isResponsable = false
                User.role = undefined
                User.roleResponsable = undefined
                await User.save();
                console.log(`${member.user.username} => DB Config Nuked!`)
            }

            if (rolesToRemove.size > 0) {
                await member.roles.remove(rolesToRemove)
                console.log(`${member.user.username} => ${rolesToRemove.size} roles removed !`)
            }

            await msg.edit(`**${loading} | **Members nuked count : \`${count}/${allMembers.size}\``)
            
        }

        await msg.edit(`**✅ | **Members nuked !`)
    }
}