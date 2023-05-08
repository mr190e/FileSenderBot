const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client({
    intents: ['GUILDS', 'GUILD_MESSAGES']
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(config.token);

fs.watch(config.path, { recursive: true }, (eventType, filename) => {
    if (eventType === 'rename') {
        if (filename.endsWith(`.${config.fileExtension}`)) {
            console.log(`File event detected: ${eventType} - ${filename}`);
            const renamedFile = filename.replace(/(\s+)/g, '\\$1');
            fs.rename(`${config.path}/${renamedFile}`, `${config.path}/${renamedFile}.txt`, (err) => {
                if (err) throw err;
                console.log(`${filename} renamed to ${renamedFile}.txt`);
                const channel = client.channels.cache.get(config.channelId);
                if (!channel) {
                    console.error(`Invalid channel ID: ${config.channelId}`);
                    return;
                }
                const attachment = new Discord.MessageAttachment(`${config.path}/${renamedFile}.txt`);
                channel.send({ files: [attachment] })
                    .then(() => console.log(`File sent to Discord: ${renamedFile}.txt`))
                    .catch(console.error);
            });
        } else {
            console.log(`Not a .${config.fileExtension} file, ignoring...`);
        }
    } else if (eventType === 'mkdir') {
        console.log(`Folder created: ${filename}`);
        fs.watch(`${config.path}/${filename}`, { recursive: true }, (event, file) => {
            if (event === 'rename') {
                if (file.endsWith(`.${config.fileExtension}`)) {
                    console.log(`File event detected: ${event} - ${file}`);
                    const renamedFile = file.replace(/(\s+)/g, '\\$1');
                    fs.rename(`${config.path}/${filename}/${renamedFile}`, `${config.path}/${filename}/${renamedFile}.txt`, (err) => {
                        if (err) throw err;
                        console.log(`${file} renamed to ${renamedFile}.txt`);
                        const channel = client.channels.cache.get(config.channelId);
                        if (!channel) {
                            console.error(`Invalid channel ID: ${config.channelId}`);
                            return;
                        }
                        const attachment = new Discord.MessageAttachment(`${config.path}/${filename}/${renamedFile}.txt`);
                        channel.send({ files: [attachment] })
                            .then(() => console.log(`File sent to Discord: ${renamedFile}.txt`))
                            .catch(console.error);
                    });
                } else {
                    console.log(`Not a .${config.fileExtension} file, ignoring...`);
                }
            }
        });
    }
});
