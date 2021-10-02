const BaseEvent = require('../../utils/structures/BaseEvent')
const Guild = require('../../src/schemas/GuildSchema')

module.exports = class guildCreateEvent extends BaseEvent {
    constructor() {
        super('guildCreate')
    }

    async run(client, guild) {
        Guild.create({
            guildId: guild.id,
            guildName: guild.name
        }, async (err) => {
            if (err) throw err && console.log(`There was an error trying to save GUILD : ${guild.name} to the database !`)
            else console.log(`Bot ${client.user.username} joined GUILD : ${guild.name} !`)
        }) 
    }
}