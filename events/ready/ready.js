const BaseEvent = require('../../utils/structures/BaseEvent');
const Guild = require('../../src/schemas/GuildSchema')
const User = require('../../src/schemas/UserSchema')
const { showCommandLoad } = require('../../utils/register')

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super('ready')
    }

    async run(client) {
        client.user.setPresence('Test')
        console.log(`Bot ${client.user.username} loaded and ready !`)
        showCommandLoad()

    
        for (const [key, value] of client.guilds.cache) {
            const guildConfig = await Guild.findOne({ guildId: key });
            if (guildConfig) {
                client.config.set(key, guildConfig)
                console.log(`Loaded data for guild : ${value.name}`)
            } else {
                Guild.create({
                    guildId: key,
                    guildName: value.name
                }, async (err) => {
                    if (err) throw err && console.log(`There was an error trying to save GUILD : ${value.name} to the database !`)
                    else console.error(`⚠️ Guild : ${value.name} wasn't saved in the database, created new entry ! ⚠️`)
                }) 
            }
        }

        const Users = await User.find({})
        for (const user of Users) {
            client.allUsers.set(user.discordId, user)
        }
        console.log(`Cached Users : ${client.allUsers.size}`)
    }
}