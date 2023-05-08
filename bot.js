const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const config = require('./config.json');

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
const channelID = config.channel;

// Watch the directory recursively for new files with the extension specified in the config
fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  if (filename && eventType === 'rename' && path.extname(filename) === config.extension) {
    const renamedFilename = `${path.parse(filename).name}.txt`;
    fs.renameSync(path.join(directoryPath, filename), path.join(directoryPath, renamedFilename));
    const attachment = new Discord.MessageAttachment(path.join(directoryPath, renamedFilename));
    const embedMessage = new Discord.MessageEmbed()
      .setTitle('New file uploaded')
      .setColor('#00FF00')
      .setDescription(`File ${filename} has been renamed to ${renamedFilename} and uploaded!`);
    client.channels.cache.get(channelID).send({ embeds: [embedMessage], files: [attachment] })
      .then(() => console.log(`File ${renamedFilename} sent to channel ${channelID}!`))
      .catch(console.error);
  }
});

// Watch the directory recursively for new folders with files with the extension specified in the config
fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  if (eventType === 'rename' && fs.existsSync(path.join(directoryPath, filename)) && fs.lstatSync(path.join(directoryPath, filename)).isDirectory()) {
    const files = fs.readdirSync(path.join(directoryPath, filename));
    const admFiles = files.filter(file => path.extname(file) === config.extension);
    if (admFiles.length > 0) {
      const attachment = admFiles.map(file => new Discord.MessageAttachment(path.join(directoryPath, filename, file)));
      const embedMessage = new Discord.MessageEmbed()
        .setTitle('New folder uploaded')
        .setColor('#00FF00')
        .setDescription(`Folder ${filename} has been uploaded!`);
      client.channels.cache.get(channelID).send({ embeds: [embedMessage], files: attachment })
        .then(() => console.log(`Folder ${filename} sent to channel ${channelID}!`))
        .catch(console.error);
    }
  }
});

// Log in to Discord
client.login(config.token);
