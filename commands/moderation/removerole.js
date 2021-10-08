const BaseCommand = require('../../utils/structures/BaseCommand');
const { userResponse } = require('../../utils/functions/awaitFunctions');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions')

const DiscordLogger = require('../../utils/services/discordLoggerService')

module.exports = class RemoveRoleCommand extends BaseCommand {
    constructor () {
        super('removerole', 'moderation', [], {
            usage: "removerole <user> <role>",
            description: "Retire le role spécifié de l'individu selectionné",
            categoryDisplayName: `🛡️ Moderation`,
            userPermissions: ['MANAGE_ROLES'],
            clientPermissions: [],
            examples: ['removerole Ominga Streameur|Retire le role streameur de l\'utilisateur Ominga', "removerole|Ouvre une interface en DM pour retirer plusieurs roles à plusieurs utilisateurs en meme temps"],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        let guild = message.guild
        let allMembers = await updateGuildMemberCache(guild)
        let allRoles = guild.roles.cache

        const moderationLogger = new DiscordLogger('moderation', '#fdcb6e')
        moderationLogger.setLogMember(message.member)
        moderationLogger.setGuild(message.guild)

        if (args[2]) {
            let selectedMember = allMembers.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()))
            try {
                args.splice(0, 2)
                let stringRole = args.join(' ')
                let role = allRoles.find(r => r.name.toLowerCase().includes(stringRole.toLowerCase()))
                selectedMember.roles.remove(role)
                message.channel.send(`**:white_check_mark: | **Vous avez retiré le role \`${role.name}\` à \`${selectedMember.user.username}\``)
                moderationLogger.info(`<@!${message.author.id}> a retiré le role \`${role.name}\` à \`${selectedMember.user.username}\``)
            } catch (error) {
                console.log(error)
                message.channel.send(`**:x: | **Veuillez renseigner des arguments valides \`(adduser <user> <role>)\``)
            } 
        } else if (!args[1]) {
            message.react('✅')
            message.author.createDM().then(async (dmChannel) => {
                let usersToRemove = userResponse(dmChannel, `Veuillez entrer les utilisateurs à selectionner \`(pseudos discord séparés d'une virgule)\` :`).catch(err => console.log(err))
                if (!usersToRemove) return
                let usersArgs = usersToRemove.content.split(/\s*[,]\s*/)
                let rolesToRemove = userResponse(dmChannel, `Veuillez entrer un/des role(s) à leur retirer \`(roles séparés d'une virgule)\` :`).catch(err => console.log(err))
                if (!rolesToRemove) return
                let rolesArgs = rolesToRemove.content.split(/\s*[,]\s*/)
                let tempMsg = await dmChannel.send(`**${loading} |** Suppression des roles en cours...`)
                let errorsCount = 0
                for (const userString of usersArgs) {
                    let member = allMembers.find(m => m.user.tag.toLowerCase().includes(userString.toLowerCase()))
                    for (const roleString of rolesArgs) {
                        let role = allRoles.find(r => r.name.toLowerCase().includes(roleString.toLowerCase()))
                        if (!role) {
                            dmChannel.send(`**:x: | **Impossible de retirer le role \`${roleString}\` à \`${userString}\``)
                            errorsCount = errorsCount+1
                        } else {
                            try {
                                await member.roles.remove(role)
                                moderationLogger.info(`<@!${message.author.id}> a retiré le role \`${role.name}\` à \`${member.user.username}\``)
                            } catch(err) {
                                dmChannel.send(`**:x: | **Impossible de retirer le role \`${roleString}\` à \`${userString}\``)
                                errorsCount = errorsCount+1
                            }
                        }
                    }
                }
                let emoji = '✅'
                if(errorsCount > 0) {
                    emoji = '⚠️'
                }
                await tempMsg.edit(`**${emoji} | **Opération terminée avec \`${errorsCount}\` erreur(s) !`)
            })
        }
    }
}