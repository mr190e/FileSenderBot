const fs = require('fs');
const Discord = require('discord.js');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  botStartTime = new Date();
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
  const uniqueNewFiles = newFiles.filter((file) => {
    if (!previousFileList.includes(file.name)) {
      const fileCreationTime = fs.statSync(`${directoryPath}/${file.name}`).ctime;
      return fileCreationTime > botStartTime;
    }
    return false;
  });

  console.log(`${uniqueNewFiles.length} new files found.`);

  // Rename the new files to .txt extension and send them to the specified Discord channel
  uniqueNewFiles.forEach((file) => {
    const oldFilePath = `${directoryPath}/${file.name}`;
    const newFilePath = `${directoryPath}/${file.name}.txt`;

    // Create a copy of the file with .txt extension
    fs.copyFileSync(oldFilePath, newFilePath);

    // Get the creation time of the new file
    const fileCreationTime = fs.statSync(newFilePath).ctime;

    // Send a message containing the file creation time, filename and the renamed file as a file attachment to the specified Discord channel
    sendFileToChannel(channel, newFilePath, fileCreationTime, `${file.name}.txt`);
  });

  // Update the previous file list to include the new files
  previousFileList = previousFileList.concat(uniqueNewFiles.map((file) => file.name));

  // Check each subdirectory for new files
  fileList.filter((file) => file.isDirectory()).forEach((subdirectory) => {
    const subdirectoryPath = `${directoryPath}/${subdirectory.name}`;
    checkForNewFiles(channel, subdirectoryPath, fileExtension);
  });
}

// Replace this with the ID of the Discord channel you want to send the files to
const channelId = 'Channel-ID';
// Replace this with the path to the directory you want to monitor
const directoryPath = '/path/to/watch';
// Replace this with the file extension you want to look for
const fileExtension = '.TXT';

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
    checkForNewFiles(channel, directoryPath, fileExtension);
  }
}, 60000); // Run every minute

// Replace this with your Discord bot token
client.login('Discord-Token');
