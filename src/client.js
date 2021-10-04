const { Client, Intents, Options } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS], partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'], makeCache: Options.cacheWithLimits(Options.defaultMakeCacheSettings) });

module.exports = client;