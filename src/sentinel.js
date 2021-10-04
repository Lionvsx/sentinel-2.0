const client = require('./client');
const mongoose = require('mongoose');
require('dotenv').config();

const { 
    registerCommands, 
    registerEvents,
    registerInteractions
  } = require('../utils/register');

  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(connection => {
    console.log(`Connected to MongoDB`)
  }).catch(err => {
    if (err) throw err;
  });

(async () => {
    client.commands = new Map();
    client.interactions = new Map();
    client.aliases = new Map();
    client.config = new Map();
    client.allUsers = new Map();
    client.reactionRoles = new Map();
    await registerCommands(client, '../commands');
    await registerEvents(client, '../events');
    await registerInteractions(client, '../interactions')
    await client.login(process.env.DISCORD_BOT_TOKEN);
  })(); 