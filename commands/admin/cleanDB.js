const BaseCommand = require('../../utils/structures/BaseCommand')
const mongoose = require('mongoose');

const { Permissions, MessageEmbed } = require('discord.js');
const { askForConfirmation } = require('../../utils/functions/awaitFunctions');

module.exports = class TestCommand extends BaseCommand {
    constructor() {
        super('cleandb', 'admin', [], {
            usage: "cleandb",
            description: "Delete all school and year entries for the user",
            categoryDisplayName: `<:triangle:1137394274816753695> Admin`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            admin: true,
            home: true,
            serverOnly: false,
            subCommands: false
        })
    }

    async run(client, message, args) {
        const allDBUsers = await mongoose.model('User').find();
        const loading = client.emojis.cache.get('741276138319380583')

        const confirmation = await askForConfirmation(message.channel, `Vous voulez vraiment reset toutes les données d'école et d'année en base de données ?`).catch(err => console.log(err))
        if (!confirmation) return;

        let msg = await message.channel.send(`**${loading} | **Nuking DB...`)
        let count = 0
        for (const user of allDBUsers) {
            user.school = undefined;
            user.schoolYear = undefined;
            user.roles = undefined;
            await user.save();
            count++;

            this.log(`DB Config Nuked for ${user.username}!`)

            let percentage = Math.floor((count / allDBUsers.size) * 100)
            let barProgress = Math.floor(percentage / 5)

            if (percentage % 5 === 0) {
                let bar = renderProgressBar(barProgress, 20)
                let embed = new MessageEmbed()
                    .setDescription(`**${loading} | **Nuking DB...\n\`\`\`${bar} ${percentage}% | ${count}/${allDBUsers.size}\`\`\``)
                    .setColor('#2b2d31')
                await msg.edit({
                    embeds: [embed],
                    content: ` `
                })
            }
        }
    }
}

function renderProgressBar(progress, size) {
    let bar = "";
    for (let i = 0; i < progress; i++) {
        bar += "█"
    }
    for (let i = 0; i < size - progress; i++) {
        bar += "▁"
    }
    return bar;
}