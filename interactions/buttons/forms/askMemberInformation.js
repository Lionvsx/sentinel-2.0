const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { menuInteraction, userResponseContent } = require('../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')
const { createMessageActionRow, createSelectionMenu, createButtonActionRow, createSelectionMenuOption, createEmojiButton } = require('../../../utils/functions/messageComponents')
const mongoose = require('mongoose');

const DiscordLogger = require('../../../utils/services/discordLoggerService');
const { isMember } = require('../../../utils/functions/dbFunctions');
const {createUserPage} = require("../../../utils/functions/notionFunctions");


module.exports = class MemberInformationFormButton extends BaseInteraction {
    constructor() {
        super('askMemberInformation', 'forms', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        const dmChannel = interaction.channel
        const ldvGuild = client.guilds.cache.get('227470914114158592')

        const databaseLogger = new DiscordLogger('database', '#00b894')
        databaseLogger.setGuild(ldvGuild)
        databaseLogger.setLogMember(await ldvGuild.members.fetch(interaction.user.id))

        const User = await mongoose.model('User').findOne({ discordId: interaction.user.id })

        if (isMember(User)) {
            let embed = new MessageEmbed()
                .setColor('2b2d31')
                .setDescription(`Vous êtes déjà enregistrés en tant que membre de LDV Esport !`)
            await interaction.update({
                embeds: [embed],
                components: []
            })
            return;
        }

        const allRoles = ldvGuild.roles.cache
        await interaction.update({
            embeds: [new MessageEmbed().setDescription(`<:arrowdown:1137420436016214058> Veuillez renseigner votre école ci dessous <:arrowdown:1137420436016214058>`).setColor('2b2d31')],
            components: [createMessageActionRow([
                createSelectionMenu('schoolMenu', 'Veuillez selectionner une école', [createSelectionMenuOption('esilv', 'ESILV', undefined, '753798801457807442'), createSelectionMenuOption('iim', 'IIM', undefined, '753798801763991650'), createSelectionMenuOption('emlv', 'EMLV', undefined, '753798801919180913'), createSelectionMenuOption('externe', 'EXTERNE', undefined, '👤')], 1, 1)
            ])]
        });
        const schoolMenu = await menuInteraction(interaction.message).catch(err => console.log(err))
        if (!schoolMenu) return restoreForm(dmChannel)

        const school = schoolMenu.values[0].toUpperCase();
        let year = 'EXTERNE'

        if (school !== 'EXTERNE') {
            await schoolMenu.update({
                embeds: [new MessageEmbed().setDescription(`<:arrowdown:1137420436016214058> Veuillez renseigner votre année ci dessous <:arrowdown:1137420436016214058>\n\`\`\`ECOLE : ${school}\`\`\``).setColor('2b2d31')],
                components: [createMessageActionRow([
                    createSelectionMenu('yearMenu', 'Veuillez selectionner une année', [createSelectionMenuOption('1', 'A1', undefined, '1️⃣'), createSelectionMenuOption('2', 'A2', undefined, '2️⃣'), createSelectionMenuOption('3', 'A3', undefined, '3️⃣'), createSelectionMenuOption('4', 'A4', undefined, '4️⃣'), createSelectionMenuOption('5', 'A5', undefined, '5️⃣')], 1, 1)
                ])]
            })
            const yearMenu = await menuInteraction(interaction.message).catch(err => console.log(err))
            if (!yearMenu) return restoreForm(dmChannel)
            year = yearMenu.values[0];
        }


        await interaction.message.edit({
            embeds: [new MessageEmbed().setDescription(`Informations enregistrées :\n\`\`\`ECOLE: ${school}\nANNEE: ${year ? year.toUpperCase() : 'NON DEFINIE'}\`\`\``).setColor('2b2d31')],
            components: []
        })
        const firstName = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ton prénom par message <:arrowdown:1137420436016214058>\n\`(exemple: Leo)\``).catch(err => console.log(err))
        if (!firstName) return restoreForm(dmChannel)

        const lastName = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ton nom de famille par message <:arrowdown:1137420436016214058>\n\`(exemple: ROUSSARD)\``).catch(err => console.log(err))
        if (!lastName) return restoreForm(dmChannel)

        const phone = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ton numéro de téléphone par message <:arrowdown:1137420436016214058>\n\`(exemple: 06 00 00 00 00)\``).catch(err => console.log(err))
        if (!phone) return restoreForm(dmChannel)

        const email = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ton adresse mail par message <:arrowdown:1137420436016214058>\n\`(exemple: leonard.roussard@edu.devinci.fr)\``).catch(err => console.log(err))
        if (!email) return restoreForm(dmChannel)

        const twitter = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ton pseudo twitter par message <:arrowdown:1137420436016214058>\n\`(exemple: Lionvsx ou aucun si vous n'en avez pas)\``).catch(err => console.log(err))
        if (!twitter) return restoreForm(dmChannel)

        const birthdate = await userResponseContent(dmChannel, `<:arrowdown:1137420436016214058> Envoie moi ta date de naissance par message sous le format YYYY-MM-DD <:arrowdown:1137420436016214058>\n\`(exemple: 2000-08-22 => 22 Aout 2000)\``).catch(err => console.log(err))
        if (!birthdate) return restoreForm(dmChannel)


        if (User && User.id) {
            databaseLogger.setLogData(`PRENOM: ${firstName}\nNOM: ${lastName.toUpperCase()}\nECOLE: ${school.toUpperCase()}\nANNEE: ${year ? year.toUpperCase() : 'NON DEFINIE'}`)
            User.firstName = firstName
            User.lastName = lastName.toUpperCase()
            User.school = school
            User.schoolYear = year !== 'EXTERNE' ? year : undefined

            let notionRoles = []
            for (const role of User.roles) {
                notionRoles.push({
                    name: role
                })
            }

            const guildMember = await ldvGuild.members.fetch(interaction.user.id)
            const rolesToAdd = allRoles.filter(role => (role.id === '624713487112732673' || role.id === '744234676088209449' || role.id === '744234761282650213' || role.id === '676797892991778879' || role.id === '676798588034220052' || role.id === '676799349841330186') && !guildMember.roles.cache.has(role.id))
            try {
                await guildMember.roles.add(rolesToAdd)
                let notionPage = await createUserPage({
                    firstName: firstName,
                    lastName: lastName,
                    school: school,
                    schoolYear: year === "EXTERNE" ? "EXTERNE" : "A" + year,
                    phone: phone,
                    email: email,
                    twitter: twitter,
                    birthDate: birthdate,
                    discordId: User.discordId,
                    discordTag: User.userTag,
                    avatarURL: interaction.user.displayAvatarURL(),
                    roles: notionRoles.length === 0 ? [{name: "Non défini"}] : notionRoles
                })
                User.linkedNotionPageId = notionPage.id
                User.isOnNotion = true
                User.isMember = true
                await User.save()
                dmChannel.send({
                    embeds: [new MessageEmbed().setTitle('<:checksquare:1137390612543459398> ` MERCI `').setColor('#2b2d31')],
                })
                await databaseLogger.info(`Nouvelle entrée dans la base de données pour <@!${User.discordId}> :`)
            } catch (error) {
                console.log(error)
                await databaseLogger.error(`Impossible d'enregistrer les informations de <@!${User.discordId}> :`)
                dmChannel.send('**<:x_:1137419292946727042> | **Le format de certaines informations entrées n\'est pas correct, vérifiez que la date de naissance a été entrée dans le bon format !')
                restoreForm(dmChannel);
            }
        }
    }
}


function restoreForm(dmChannel) {
    const componentRow = createButtonActionRow([
        createEmojiButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SECONDARY' , '<:checksquare:1137390612543459398>')
    ])
    const embed = new MessageEmbed()
        .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurions besoin de quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('#2b2d31')
    dmChannel.send({
        embeds: [embed],
        components: [componentRow]
    })
}