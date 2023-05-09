const fs = require('fs');
const Discord = require('discord.js');

// Load config from config.json
let config;
try {
  config = require('./config.json');
} catch (error) {
  console.error('Could not load config file!');
  process.exit(1);
}

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

async function sendFileToChannel(channel, filePath, fileCreationTime, fileName) {
  const attachment = new Discord.MessageAttachment(filePath);
  const fileCreationDate = fileCreationTime.toLocaleString();
  const messageText = `New file "${fileName}" found created at ${fileCreationDate}`;
  await channel.send({ content: messageText, files: [attachment] });
}

let previousFileList = [];

function checkForNewFiles(channel, directoryPath, fileExtension) {
  // Get a list of files and subdirectories in the directory
  const fileList = fs.readdirSync(directoryPath, { withFileTypes: true });

  // Filter the list to only include files with the specified extension
  const newFiles = fileList.filter((file) => file.isFile() && file.name.endsWith(fileExtension));

  // Filter the new files to exclude files that were already sent in the previous check
  const uniqueNewFiles = newFiles.filter((file) => !previousFileList.includes(file.name));

  // Rename the new files to .txt extension and send them to the specified Discord channel
  uniqueNewFiles.forEach((file) => {
    const newFileName = file.name.slice(0, -fileExtension.length) + '.txt';
    const oldFilePath = `${directoryPath}/${file.name}`;
    const newFilePath = `${directoryPath}/${newFileName}`;

    // Get the creation time of the new file
    const fileCreationTime = fs.statSync(oldFilePath).ctime;

    // Rename the file
    fs.renameSync(oldFilePath, newFilePath);

    // Send a message containing the file creation time, filename and the renamed file as a file attachment to the specified Discord channel
    sendFileToChannel(channel, newFilePath, fileCreationTime, file.name);
  });

  // Update the previous file list to include the new files
  previousFileList = previousFileList.concat(uniqueNewFiles.map((file) => file.name));

  // Check each subdirectory for new files
  fileList.filter((file) => file.isDirectory()).forEach((subdirectory) => {
    const subdirectoryPath = `${directoryPath}/${subdirectory.name}`;
    checkForNewFiles(channel, subdirectoryPath, fileExtension);
  });
}

// Load config variables
const channelId = config.channelId;
const directoryPath = config.directoryPath;
const fileExtension = config.fileExtension;
const token = config.token;

// Check if config variables are set
if (!channelId || !directoryPath || !fileExtension || !token) {
  console.error('Incomplete config file!');
  process.exit(1);
}

let firstRun = true;

setInterval(() => {
  const channel = client.channels.cache.get(channelId);

  if (firstRun) {
    const fileList = fs.readdirSync(directoryPath, { withFileTypes: true });
    fileList.filter((file) => file.isDirectory()).forEach((subdirectory) => {
      const subdirectoryPath = `${directoryPath}/${subdirectory.name}`;
      checkForNewFiles(channel, subdirectoryPath, fileExtension);
    });
    firstRun = false;
  } else {
    checkForNewFiles(channel, directoryPath,
