const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const {Permissions, MessageEmbed} = require("discord.js");
const Teams = require('../../../../src/schemas/TeamSchema');
const {createSelectionMenu, createSelectionMenuOption, createMessageActionRow,
    createEmojiButton
} = require("../../../../utils/functions/messageComponents");
const {menuInteraction} = require("../../../../utils/functions/awaitFunctions");
const {updateTeamsDashboard, getTeamMembers} = require("../../../../utils/functions/teamsFunctions");
const cron = require('node-cron');
const {getNotionPageById} = require("../../../../utils/functions/notionFunctions");
module.exports = class ButtonSMConfig extends BaseInteraction {
    constructor() {
        super('buttonSMConfig', 'teams', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
        })
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return

        let parentCategoryId = buttonArgs[1]
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})

        if (!Team) return interaction.reply('<:x_:1137419292946727042> Erreur critique de configuration')
        await interaction.reply({
            content: '<:check:1137390614296678421> Check tes DMS',
            ephemeral: true
        })
        const dmChannel = await interaction.user.createDM();

        // Ask if the team is subject to mandatory sport
        const sportObligatoryMenu = createSelectionMenu('sportObligatorySelect', 'Est ce que l\'équipe est soumise au sport obligatoire?', [
            createSelectionMenuOption('yes', 'Oui', undefined, '<:check:1137390614296678421>'),
            createSelectionMenuOption('no', 'Non', undefined, '<:x_:1137419292946727042>'),
        ], 1, 1);

        let sportObligatoryMessage = await dmChannel.send({
            embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> Sport obligatoire: <:arrowdown:1137420436016214058>').setColor('#2b2d31')],
            components: [createMessageActionRow([sportObligatoryMenu])]
        });

        let sportObligatoryInteraction = await menuInteraction(sportObligatoryMessage).catch(err => console.log(err));
        let sportObligatory = sportObligatoryInteraction.values[0] === 'yes';
        sportObligatoryInteraction.deferUpdate();

        // Ask for training keywords with a select menu
        const trainingKeywordsMenu = createSelectionMenu('trainingKeywordsSelect', 'Quels mots clés pour les entrainements?', [
            createSelectionMenuOption('training', 'Training'),
            createSelectionMenuOption('scrim', 'Scrim'),
            createSelectionMenuOption('pracc', 'Pracc'),
            createSelectionMenuOption('entrainement', 'Entrainement'),
        ], 1, 4);

        let trainingKeywordsMessage = await dmChannel.send({
            embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> Mots clés pour les entrainements: <:arrowdown:1137420436016214058>').setColor('#2b2d31')],
            components: [createMessageActionRow([trainingKeywordsMenu])]
        });

        let trainingKeywordsInteraction = await menuInteraction(trainingKeywordsMessage).catch(err => console.log(err));
        let trainingKeywords = trainingKeywordsInteraction.values;
        trainingKeywordsInteraction.deferUpdate();

        // Ask for the number of players required for training with a select menu
        const playersRequiredMenu = createSelectionMenu('playersRequiredSelect', 'Combien de joueurs nécessaires pour 1 entrainement?', [
            createSelectionMenuOption('1', '1 joueur', undefined, '1️⃣'),
            createSelectionMenuOption('2', '2 joueurs', undefined, '2️⃣'),
            createSelectionMenuOption('3', '3 joueurs', undefined, '3️⃣'),
            createSelectionMenuOption('4', '4 joueurs', undefined, '4️⃣'),
            createSelectionMenuOption('5', '5 joueurs', undefined, '5️⃣'),
            createSelectionMenuOption('6', '6 joueurs', undefined, '6️⃣'),
        ], 1, 1);

        let playersRequiredMessage = await dmChannel.send({
            embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> Nombre de joueurs pour 1 entrainement: <:arrowdown:1137420436016214058>').setColor('#2b2d31')],
            components: [createMessageActionRow([playersRequiredMenu])]
        });

        let playersRequiredInteraction = await menuInteraction(playersRequiredMessage).catch(err => console.log(err));
        let playersRequired = playersRequiredInteraction.values[0];
        playersRequiredInteraction.deferUpdate();

        // Ask for average time of a training with a select menu in minutes
        const trainingTimeMenu = createSelectionMenu('trainingTimeSelect', 'Combien de temps dure un entrainement en moyenne?', [
            createSelectionMenuOption('15', '15 minutes', undefined, '<:clock:1139536765837901916>'),
            createSelectionMenuOption('30', '30 minutes', undefined, '<:clock:1139536765837901916>'),
            createSelectionMenuOption('45', '45 minutes', undefined, '<:clock:1139536765837901916>'),
            createSelectionMenuOption('60', '1 heure', undefined, '<:clock:1139536765837901916>'),
        ], 1, 1);

        let trainingTimeMessage = await dmChannel.send({
            embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> Durée moyenne d\'une game: <:arrowdown:1137420436016214058>').setColor('#2b2d31')],
            components: [createMessageActionRow([trainingTimeMenu])]
        });

        let trainingTimeInteraction = await menuInteraction(trainingTimeMessage).catch(err => console.log(err));
        let trainingTime = trainingTimeInteraction.values[0];
        trainingTimeInteraction.deferUpdate();


        Team.sport = sportObligatory;
        Team.trainTags = trainingKeywords;
        Team.minPlayers = playersRequired;
        Team.trainingTime = trainingTime;
        Team.dashboardChannelId = interaction.channelId
        Team.smartManager = true;
        Team.availabilitiesAnswered = 0;
        Team.playersAnswered = [];
        Team.availabilities = [];
        await Team.save();

        await dmChannel.send({
            embeds: [new MessageEmbed().setDescription('<:check:1137390614296678421> Le smart manager a été configuré avec succès').setColor('#2b2d31')],
        });
        this.log("Smart manager configured for team " + Team.name + " (" + Team._id + ")")

        // Update the dashboard
        await updateTeamsDashboard(interaction.channel, true);

        await sendAvailabilitiesForm(interaction, Team)
    }
}

async function sendAvailabilitiesForm(interaction, Team) {
    let notionTeam = await getNotionPageById(Team.linkedNotionPageId)

    let players = await getTeamMembers(notionTeam)

    let teamCategory = await interaction.guild.channels.fetch(Team.linkedCategoryId)
    let staffChannel = teamCategory.children.find(channel => channel.name.includes('staff'))

    const createHourlyAvailabilityOptions = (startHour, endHour, emoji) => {
        let options = [];
        for (let hour = startHour; hour < endHour; hour++) {
            const label = `${hour}:00 - ${hour + 1}:00`;
            options.push(createSelectionMenuOption(hour.toString(), label, undefined, emoji));
        }
        return options;
    };

    const dayOptions = createHourlyAvailabilityOptions(12, 18, '<:sun:1152170231050027038>');
    const eveningOptions = createHourlyAvailabilityOptions(18, 24, '<:sunset:1152170114456764426>');
    const nightOptions = createHourlyAvailabilityOptions(0, 6, '<:moon:1152170097356578877>');

    const mondayMenu = createSelectionMenu(`askPlayerPlanning|Monday|${Team.linkedCategoryId}`, 'Disponibilité pour Lundi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const tuesdayMenu = createSelectionMenu(`askPlayerPlanning|Tuesday|${Team.linkedCategoryId}`, 'Disponibilité pour Mardi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const wednesdayMenu = createSelectionMenu(`askPlayerPlanning|Wednesday|${Team.linkedCategoryId}`, 'Disponibilité pour Mercredi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const thursdayMenu = createSelectionMenu(`askPlayerPlanning|Thursday|${Team.linkedCategoryId}`, 'Disponibilité pour Jeudi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const fridayMenu = createSelectionMenu(`askPlayerPlanning|Friday|${Team.linkedCategoryId}`, 'Disponibilité pour Vendredi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const saturdayMenu = createSelectionMenu(`askPlayerPlanning|Saturday|${Team.linkedCategoryId}`, 'Disponibilité pour Samedi:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);
    const sundayMenu = createSelectionMenu(`askPlayerPlanning|Sunday|${Team.linkedCategoryId}`, 'Disponibilité pour Dimanche:', [...dayOptions, ...eveningOptions, ...nightOptions], 1, 18);


    for (const playerId of players) {
        let playerDiscord = await interaction.guild.members.fetch(playerId)
        let playerDM = await playerDiscord.createDM()

        await playerDM.send({
            embeds: [
                new MessageEmbed()
                    .setDescription('<:arrowdown:1137420436016214058> Veuillez indiquer vos disponibilités pour la semaine (Lundi-Vendredi): <:arrowdown:1137420436016214058>')
                    .setColor('#2b2d31')
            ],
            components: [
                createMessageActionRow([mondayMenu]),
                createMessageActionRow([tuesdayMenu]),
                createMessageActionRow([wednesdayMenu]),
                createMessageActionRow([thursdayMenu]),
                createMessageActionRow([fridayMenu]),
            ]
        })

        await playerDM.send({
            embeds: [
                new MessageEmbed()
                    .setDescription('<:arrowdown:1137420436016214058> Veuillez indiquer vos disponibilités pour le week-end (Samedi-Dimanche): <:arrowdown:1137420436016214058>')
                    .setColor('#2b2d31')
            ],
            components: [
                createMessageActionRow([saturdayMenu]),
                createMessageActionRow([sundayMenu]),
                createMessageActionRow([
                    createEmojiButton(`validateAvailabilities|${Team.linkedCategoryId}`, 'Je confirme mes disponibilités', 'SECONDARY', '<:check:1137390614296678421>')
                ])
            ]
        })
    }

    staffChannel.send({
        embeds: [
            new MessageEmbed().setDescription(`<:check:1137390614296678421> J'ai envoyé les formulaires de disponibilités pour la semaine à l'équipe \`${Team.name}\``).setColor('#2b2d31')
        ]
    })
}