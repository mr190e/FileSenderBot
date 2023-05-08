const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

// Read configuration from config.json
const config = require('./config.json');
const directoryPath = config.directoryPath;
const channelID = config.channelID;
const token = config.token;

// Set up the Discord client
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES
  ]
});

// Watch the directory recursively for new files and folders with the .ADM extension
fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  const fullPath = path.join(directoryPath, filename);
  if (filename && (eventType === 'rename' || eventType === 'renameDir') && path.extname(filename) === '.ADM') {
    // Check if it's a folder
    const isFolder = fs.lstatSync(fullPath).isDirectory();
    // If it's a folder, watch it for changes
    if (isFolder) {
      fs.watch(fullPath, { recursive: false }, (event, file) => {
        const newFullPath = path.join(fullPath, file);
        if (file && (event === 'rename' || event === 'renameDir') && path.extname(file) === '.ADM') {
          const renamedFilename = `${path.parse(file).name}.txt`;
          fs.renameSync(newFullPath, path.join(fullPath, renamedFilename));
          const attachment = new Discord.MessageAttachment(path.join(fullPath, renamedFilename));
          const embedMessage = new Discord.MessageEmbed()
            .setTitle('New file uploaded')
            .setColor('#00FF00')
            .setDescription(`File ${file} has been renamed to ${renamedFilename} and uploaded!`)
          client.channels.cache.get(channelID).send({ embeds: [embedMessage], files: [attachment] })
            .then(() => console.log(`File ${renamedFilename} sent to channel ${channelID}!`))
            .catch(console.error);
        }
      });
    } else { // If it's a file, process it
      const renamedFilename = `${path.parse(filename).name}.txt`;
      fs.renameSync(fullPath, path.join(directoryPath, renamedFilename));
      const attachment = new Discord.MessageAttachment(path.join(directoryPath, renamedFilename));
      const embedMessage = new Discord.MessageEmbed()
        .setTitle('New file uploaded')
        .setColor('#00FF00')
        .setDescription(`File ${filename} has been renamed to ${renamedFilename} and uploaded!`)
      client.channels.cache.get(channelID).send({ embeds: [embedMessage], files: [attachment] })
        .then(() => console.log(`File ${renamedFilename} sent to channel ${channelID}!`))
        .catch(console.error);
    }
  }
});

// Log in to Discord
client.login(token);
