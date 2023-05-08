const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');

// Load the config file
let config;
try {
  config = require('./config.json');
} catch (error) {
  console.error('Failed to load config file:', error);
  process.exit(1);
}

// Set up the Discord client
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES
  ]
});

// Set the directory to monitor
const directoryPath = config.path;

// Set the channel to send the message to
const channelID = config.channelID;

// Set the file extension to monitor
const fileExtension = config.fileExtension;

// Watch the directory recursively for new files and folders with the specified extension
fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  if (filename && eventType === 'rename' && path.extname(filename) === `.${fileExtension}`) {
    const renamedFilename = `${path.parse(filename).name}.txt`;
    fs.rename(path.join(directoryPath, filename), path.join(directoryPath, renamedFilename), (err) => {
      if (err) {
        console.error(`Failed to rename file ${filename}:`, err);
        return;
      }
      const attachment = new Discord.MessageAttachment(path.join(directoryPath, renamedFilename));
      const embedMessage = new Discord.MessageEmbed()
        .setTitle('New file uploaded')
        .setColor('#00FF00')
        .setDescription(`File ${filename} has been renamed to ${renamedFilename} and uploaded!`)
      client.channels.cache.get(channelID).send({ embeds: [embedMessage], files: [attachment] })
        .then(() => console.log(`File ${renamedFilename} sent to channel ${channelID}!`))
        .catch(console.error);
    });
  }
});

// Log in to Discord
const token = config.token;
client.login(token);
