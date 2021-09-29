const client = require('./client');
require('dotenv').config()

const { 
    registerCommands, 
    registerEvents,
  } = require('../utils/register');

(async () => {
    client.commands = new Map();
    client.admins = new Map();
    client.membresAsso = new Map();
    client.reactionRoles = new Map();
    await registerCommands(client, '../commands');
    await registerEvents(client, '../events');
    await client.login(process.env.DISCORD_BOT_TOKEN);
  })(); 