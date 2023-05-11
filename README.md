WORK IN PROGRESS

# FileSenderBot
A Discord bot that watches a path for new folders and than sends certain files from that new folder to a discord channel. It also checks the size of that file to prevent sending "empty" files.

The bot is created to run on windows server 2022. Not sure how it will run under any other OS, especially becauase the file creation date/time is handled different per OS and per NodeJS version, as well as fs version.

Feel free to commit and fork.

To run the bot install just use

```
git clone https://github.com/mr190e/FileSenderBot

npm install

nano config.json

node bot.js
```
This bot is based on Discord.js v13
