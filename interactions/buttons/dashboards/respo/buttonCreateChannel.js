const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, selectorReply, askForConfirmation, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const { createSelectionMenu, createSelectionMenuOption, createMessageActionRow} = require('../../../../utils/functions/messageComponents')
const { getEmoji, getUsersAndRolesFromString } = require('../../../../utils/functions/utilitaryFunctions')
const mongoose = require('mongoose')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

const poleRoleIds = {
    webtv : "622108579792683010",
    da :  "622108762416611329",
    com :  "622109740637487130",
    event : "622109829150015498",
    esport : "624715536693198888",
    partenariat : "894735081254551583"
}

const poleCategoryIds = {
    webtv : "741688834525364265",
    da :  "741688796864839730",
    com :  "741991177858842685",
    event : "742083412990361621",
    esport : "741991157550022726",
    partenariat :"894735891329847396"
}

module.exports = class CreateChannelButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonCreateChannel', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {

        const dmChannel = await interaction.user.createDM()

        const loading = client.emojis.cache.get('741276138319380583')

        const userDB = await mongoose.model('User').findOne({ onServer: true, discordId: interaction.user.id })
        
        if (!userDB.roleResponsable) {
            interaction.reply({
                content: `**❌ | **Vous n'êtes pas responsable dans la base de données !`,
                ephemeral: true
            })
            return
        }
        
        interaction.deferUpdate()

        const channelLogger = new DiscordLogger('channel', '#00cec9')
        channelLogger.setLogMember(interaction.member)
        channelLogger.setGuild(interaction.guild)


        let typeEmbed = new MessageEmbed()
            .setDescription(`Bonjour ${interaction.user.username}, \nQuel type de channel voulez vous créer?`)
            .setColor('#2ecc71')

        const selectionMenuComponent = createSelectionMenu('selectionCreateChannelMenu', 'Veuillez sélectionner un type de channel', [
            createSelectionMenuOption('GUILD_TEXT', 'Channel Textuel', undefined, '💬'),
            createSelectionMenuOption('GUILD_VOICE', 'Channel Vocal', undefined, '🔊'),
            createSelectionMenuOption('GUILD_STAGE_VOICE', 'Channel de Conférence', undefined, '👥'),
            createSelectionMenuOption('CANCEL', 'Annulez la commande', undefined, '❌')
        ], 1, 1)
        const selectionMenuMessage = await dmChannel.send({
            embeds: [typeEmbed],
            components: [createMessageActionRow([selectionMenuComponent])]
        })

        const selectionMenuInteraction = await menuInteraction(selectionMenuMessage).catch(err => console.log(err))
        if (!selectionMenuInteraction) return;

        if (selectionMenuInteraction.values[0] === 'CANCEL') return selectionMenuInteraction.update({
            embeds: [new MessageEmbed().setDescription(`**❌ | **Commande annulée`)],
            component: []
        })

        selectionMenuInteraction.deferUpdate()

        const channelPermissions = [
            { id: interaction.guild.roles.everyone.id, deny: Permissions.FLAGS.VIEW_CHANNEL },
            { id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SEND_MESSAGES] }
        ]

        const channelName = await userResponseContent(dmChannel, `Quel nom voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelName) return;
        const channelEmoji = await userResponseContent(dmChannel, `Quel emoji voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelEmoji) return;

        const userAndRolesToAdd = await userResponseContent(dmChannel, "Quels autres utilisateurs ou rôles souhaitez vous rajouter au channel : \`(pseudos discord ou roles séparés d'une virgule, tapez \"aucun\" si il n'y en a aucun)\`").catch(err => console.log(err))
        if (!userAndRolesToAdd) return;

        let audience = undefined
        if (userAndRolesToAdd.toLowerCase() != 'aucun') {
            audience = await getUsersAndRolesFromString(interaction.guild, userAndRolesToAdd.split(/\s*[,]\s*/))
            if (audience.length === 0) return
            for (const element of audience) {
                channelPermissions.push({ id: element.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
            }
        }

        const permissionSelectorMenu = selectionMenuInteraction.values[0] === 'GUILD_TEXT' ? createSelectionMenu('selectPermissionMenu', 'Veuillez sélectionner un modèle de permissions', [
            createSelectionMenuOption('annonce', 'Channel Annonce', `Seul le Head Staff peut envoyer des messages`, '📢'),
            createSelectionMenuOption('discussion', 'Channel Discussion', `Tout le monde peut parler`, '💬'),
            createSelectionMenuOption('interpole', 'Channel Communication Inter-Pole', `Seul le votre pôle peut parler, pas les rôles/utilisateurs additionnels`, '🔃'),
            createSelectionMenuOption('documents', 'Channel Documents', `Seul vous pouvez parler`, '📂'),

        ], 1, 1) 
        : selectionMenuInteraction.values[0] === 'GUILD_VOICE' ? createSelectionMenu('selectPermissionMenu', 'Veuillez sélectionner un modèle de permissions', [
            createSelectionMenuOption('vocal', 'Channel Vocal', `Tout le monde peut parler`, '🔊'),
            createSelectionMenuOption('reunion', 'Channel .Réunion', `Seul vous pouvez parler, vous aurez besoin de démute les autres`, '🔺'),
            createSelectionMenuOption('private', 'Channel privé', `Seulement vous pourrez vous connecter`, '🔒'),
        ], 1, 1)
        : undefined

        const allRoles = interaction.guild.roles.cache

        const poleRole = allRoles.get(poleRoleIds[userDB.roleResponsable])
        if (!poleRole) return dmChannel.send(`**❌ | **Le rôle de vôtre pôle est introuvable !`)
        
        if (permissionSelectorMenu) {
            const permissionSelectorMessage = await dmChannel.send({
                embeds: [new MessageEmbed().setDescription('🔽 Veuillez sélectionner un type de permission 🔽').setColor('#2ecc71')],
                components: [createMessageActionRow([permissionSelectorMenu])]
            })
            const permissionSelectorMenuInteraction = await menuInteraction(permissionSelectorMessage).catch(err => console.log(err))
            if (!permissionSelectorMenuInteraction) return;

            permissionSelectorMenuInteraction.deferUpdate()

            const permOptions = permissionOptions[permissionSelectorMenuInteraction.values[0]]
            channelPermissions.push({ id: poleRole.id, allow: permOptions.linkedRole.allow, deny: permOptions.linkedRole.deny })
            channelPermissions.push({ id: interaction.guild.roles.everyone.id, allow: permOptions.everyoneRole.allow, deny: permOptions.everyoneRole.deny })
        } else {
            channelPermissions.push({ id: element.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
        }

        const emoji = getEmoji(channelEmoji)
        if (!emoji) return dmChannel.send(`**❌ | **Emoji non valide !`)

        const tempMsg = await dmChannel.send(`**${loading} | **Création du channel en cours ...`)
        const newChannel = await interaction.guild.channels.create(`${emoji}┃${channelName}`, {
            permissionOverwrites: channelPermissions,
            type: selectionMenuInteraction.values[0],
            reason: "Creation de channel par responsable",
            parent: interaction.guild.channels.cache.get(poleCategoryIds[userDB.roleResponsable])
        })

        tempMsg.edit(`**✅ | **Channel crée avec succès !`)

        channelLogger.setLogData(`Name: ${newChannel.name}\nCategory: ${newChannel.parent.name}\nType: ${newChannel.type}`)

        channelLogger.info(`<@!${interaction.user.id}> a crée un nouveau channel dans sa catégorie`)


    }
}

const permissionOptions = {
    annonce: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    discussion: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL]
        }
    },
    interpole: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    documents: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    vocal: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL]
        }
    },
    reunion: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SPEAK]
        }
    },
    private: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT]
        }
    },
}