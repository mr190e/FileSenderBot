const fs = require('fs');
const path = require('path');
const { Client, Intents, MessageAttachment, MessageEmbed } = require('discord.js');
const bytes = require('bytes');

// Load the configuration from config.json
const config = require('./config.json');

// Discord bot token from the configuration file
const token = config.token;

// Path to watch for newly created folders
const watchPath = config.watch_path;

// Discord channel ID where files will be sent
const channelId = config.channel_id;

// File extension to look for
const fileExtension = config.file_extension;

// File tracking set to avoid duplicates
const fileTracker = new Set();

// Create a new Discord client
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  startWatching();
});

// Function to send file information to the Discord channel
async function sendFileInfo(file) {
  const stats = fs.statSync(file);
  const fileSize = stats.size;

  // Check if the file size is larger than 10 kilobytes (10,240 bytes)
  if (fileSize > 10240) {
    const fileInfo = {
      creationDate: stats.ctime.toUTCString(),
      fileName: path.basename(file),
      fileSize: bytes(fileSize), // Convert file size to human-readable format
    };

    const attachment = new MessageAttachment(file);

    const embed = new MessageEmbed()
      .setTitle('New ADM file found')
      .setDescription('File information')
      .addField('Creation Date', fileInfo.creationDate)
      .addField('File Name', fileInfo.fileName)
      .addField('File Size', fileInfo.fileSize);

    const channel = await client.channels.fetch(channelId);
    channel.send({ content: 'New File:', files: [attachment], embeds: [embed] });
  }
}

// Function to watch for newly created folders
function startWatching() {
  fs.watch(watchPath, { recursive: true }, async (eventType, filename) => {
    if (eventType === 'rename' && !fileTracker.has(filename)) {
      const file = path.join(watchPath, filename);
      const fileExt = path.extname(file);
      if (fileExt === fileExtension) {
        fileTracker.add(filename);
        await sendFileInfo(file);
      }
    }
  });
}

// Log in the Discord bot
client.login(token);
