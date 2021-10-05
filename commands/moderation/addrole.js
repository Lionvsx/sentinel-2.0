const BaseCommand = require('../../utils/structures/BaseCommand');
const { userResponse } = require('../../utils/functions/awaitFunctions');
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions')

module.exports = class AddRoleCommand extends BaseCommand {
    constructor () {
        super('addrole', 'moderation', [], {
            usage: "addrole <user> <role>",
            description: "Ajoute le role spécifié à l'utilisateur sélectionné",
            categoryDisplayName: `🛡️ Moderation`,
            userPermissions: ['MANAGE_ROLES'],
            clientPermissions: [],
            examples: ['addrole Ominga Streameur|Ajoute le role streameur de l\'utilisateur Ominga', "addrole|Ouvre une interface en DM pour ajouter plusieurs roles à plusieurs utilisateurs en meme temps"],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (bot, message, args) {
        const loading = bot.emojis.cache.get('741276138319380583')
        let guild = message.guild
        let allMembers = await updateGuildMemberCache(guild);
        let allRoles = guild.roles.cache

        if (args[2]) {
            let selectedMember = allMembers.find(m => m.user.tag.toLowerCase().includes(args[1].toLowerCase()))
            try {
                args.splice(0, 2)
                let stringRole = args.join(' ')
                let role = allRoles.find(r => r.name.toLowerCase().includes(stringRole.toLowerCase()))
                selectedMember.roles.add(role)
                message.channel.send(`**:white_check_mark: | **Vous avez ajouté le role \`${role.name}\` à \`${selectedMember.user.username}\``)
            } catch (error) {
                console.log(error)
                message.channel.send(`**:x: | **Veuillez renseigner des arguments valides \`(adduser <user> <role>)\``)
            }
        } else if (!args[1]) {
            message.react('✅')
            message.author.createDM().then(async (dmChannel) => {
                let usersToAdd = await userResponse(dmChannel, `Veuillez entrer les utilisateurs à selectionner \`(pseudos discord séparés d'une virgule)\` :`).catch(err => console.log(err))
                if (!usersToAdd) return
                let usersArgs = usersToAdd.content.split(/\s*[,]\s*/)
                let rolesToAdd = await userResponse(dmChannel, `Veuillez entrer un/des role(s) à leur ajouter \`(roles séparés d'une virgule)\` :`).catch(err => console.log(err))
                if (!rolesToAdd) return
                let rolesArgs = rolesToAdd.content.split(/\s*[,]\s*/)
                let tempMsg = await dmChannel.send(`**${loading} |** Ajouts des roles en cours...`)
                let errorsCount = 0
                for (const userString of usersArgs) {
                    let member = allMembers.find(m => m.user.tag.toLowerCase().includes(userString.toLowerCase()))
                    for (const roleString of rolesArgs) {
                        let role = allRoles.find(r => r.name.toLowerCase().includes(roleString.toLowerCase()))
                        if (!role) {
                            dmChannel.send(`**:x: | **Impossible d'ajouter le role \`${roleString}\` à \`${userString}\``)
                            errorsCount = errorsCount+1
                        } else {
                            try {
                                await member.roles.add(role)
                            } catch(err) {
                                dmChannel.send(`**:x: | **Impossible d'ajouter le role \`${roleString}\` à \`${userString}\``)
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



