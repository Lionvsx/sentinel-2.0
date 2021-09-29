const path = require('path');
const fs = require('fs-extra').promises;
const BaseCommand = require('./structures/BaseCommand');
const BaseEvent = require('./structures/BaseEvent');
const ascii = require('ascii-table');
let table = new ascii('Commands');

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
        cmd.aliases.forEach(alias => {
          client.aliases.set(alias, cmd)
        })
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

async function showCommandLoad() {
  if (table.__rows.length != 0) {
    console.log(table.toString());
  } else {
    console.log(`No commands to load !`)
  }
}

module.exports = { 
    registerCommands,
    registerEvents,
    showCommandLoad
  };