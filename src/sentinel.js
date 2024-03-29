const client = require('./client');
const mongoose = require('mongoose');
require('dotenv').config();
const {Configuration, OpenAIApi} = require('openai');


const config = new Configuration({
    organizationId: "org-le4yQgH85p1FXwryz6dtWDmx",
    apiKey: process.env.OPENAI_API_KEY,
});

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
    client.allTickets = new Map();
    client.reactionRoles = new Map();
    client.clipboard = new Map();
    client.openAIAgent = new OpenAIApi(config);
    client.tasks = new Map();
    await registerCommands(client, '../commands');
    await registerEvents(client, '../events');
    await registerInteractions(client, '../interactions')
    await client.login(process.env.DISCORD_BOT_TOKEN);
  })();