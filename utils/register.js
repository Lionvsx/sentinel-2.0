const path = require('path');
const fs = require('fs-extra').promises;
const BaseCommand = require('./structures/BaseCommand');
const BaseEvent = require('./structures/BaseEvent');
const BaseInteraction = require('./structures/BaseInteraction')
const ascii = require('ascii-table');
let table = new ascii('Commands');
let interactionTable = new ascii('Interactions');

async function registerCommands(client, dir = '') {
  table.setHeading('Command', 'Status')
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerCommands(client, path.join(dir, file));
    if (file.endsWith('.js')) {
      const Command = require(path.join(filePath, file));
      if (Command.prototype instanceof BaseCommand) {
        const cmd = new Command();
        table.addRow(`${cmd.name}.js`,'✅')
        client.commands.set(cmd.name, cmd);
        if (!cmd.name && cmd.help) {
          table.addRow(`${cmd.name}.js`, '❌ -> Error in the structure')
        }
      }
    }
  }
}

async function registerEvents(client, dir = '') {
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerEvents(client, path.join(dir, file));
    if (file.endsWith('.js')) {
      const Event = require(path.join(filePath, file));
      if (Event.prototype instanceof BaseEvent) {
        const event = new Event();
        client.on(event.name, event.run.bind(event, client));
      }
    }
  }
}

async function registerInteractions(client, dir = '') {
  interactionTable.setHeading('Interaction', 'Status')
  const filePath = path.join(__dirname, dir);
  const files = await fs.readdir(filePath);
  for (const file of files) {
    const stat = await fs.lstat(path.join(filePath, file));
    if (stat.isDirectory()) registerInteractions(client, path.join(dir, file));
    if (file.endsWith('.js')) {
      const Interaction = require(path.join(filePath, file));
      if (Interaction.prototype instanceof BaseInteraction) {
        const inter = new Interaction();
        interactionTable.addRow(`${inter.name}.js`,'✅')
        client.interactions.set(inter.name, inter);
        if (!inter.name && inter.help) {
          interactionTable.addRow(`${inter.name}.js`, '❌ -> Error in the structure')
        }
      }
    }
  }
}

async function showCommandLoad() {
  if (table.__rows.length != 0) {
    console.log(table.toString());
  } else {
    console.log(`No commands to load !`)
  }
  if (interactionTable.__rows.length != 0) {
    console.log(interactionTable.toString());
  } else {
    console.log(`No interactions to load !`)
  }
}

module.exports = { 
    registerCommands,
    registerEvents,
    showCommandLoad,
    registerInteractions
  };