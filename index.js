require ('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js');
const fs = require("fs");
const path = require('path');
const https = require('https');
const { runGeminiPro, runGeminiVision} = require('./gemini.js');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages],
    partials:[
      Partials.Message,
      Partials.Channel,
      Partials.Reaction
    ]});


client.login(process.env.DISCORD_TOKEN);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

authorizedUsers = process.env.AUTHORIZED_USERS.split(',');
authorizedChannels = process.env.AUTHORIZED_CHANNELS.split(',');


client.on('messageCreate', async (message) => {
  try {
    if(message.author.bot) return;
    if (message.channel.type === ChannelType.DM && authorizedUsers.includes(message.author.id)) 
    {
      message.reply('Hey there, how can I help you?');
      // generate response from gemini api
      const prompt = message.content;
      try{
        const response = await runGeminiPro(prompt);
        const responseChunks = splitResponse(response);
        for (const chunk of responseChunks) {
          await message.reply(chunk);
        }
        }
        catch(error){
          console.error(error);
          message.reply('there was an error trying to execute that command!');
        }
    }

    if (message.channel.type === ChannelType.GuildText && authorizedChannels.includes(message.channel.id)) {
      if(!message.mentions.users.has(client.user.id)) return;
      else {
        const userId = message.author.id;
        message.reply(`Hey there, @${userId} how can I help you?`)
        // generate response from gemini api
        const prompt = message.content;
        let localPath = null;
        let mimeType = null;

        //vision model
        if (message.attachments.size > 0) {
          let attachment = message.attachments.first(); // get the first attachment
          let url = attachment.url; // get the attachment URL
          mimeType = attachment.contentType; // get the MIME type
          let filename = attachment.name; // get the filename
        
          // Define the path where the file will be saved
          localPath = path.join(__dirname, 'image', filename);

          // Ensure the directory exists
          fs.mkdirSync(path.dirname(localPath), { recursive: true });
        
          // Download the file
          let file = fs.createWriteStream(localPath);
          https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', async function() {
              file.close(async () => {  // close() is async, call runGeminiVision() here
                // Get file stats
                const stats = fs.statSync(localPath);
                // Get file size in bytes
                const fileSizeInBytes = stats.size;
                // Check if file size exceeds limit
                if (fileSizeInBytes > 3145728) {
                  // File size exceeds limit, handle accordingly
                  message.reply('The provided image is too large. Please provide an image smaller than 4M');
                } else {
                  // File size is within limit, proceed with runGeminiVision
                  try {
                    const result = await runGeminiVision(prompt, localPath, mimeType);
                    const responseChunks = splitResponse(result);
                    for (const chunk of responseChunks) {
                      await message.reply(chunk);
                    }
                  } catch(error) {
                    console.error(error);
                    message.reply('there was an error trying to execute that command!');
                  }
                }
              });
            });
          });
        }else{
          try{
            const result = await runGeminiPro(prompt);
            const responseChunks = splitResponse(result);
            for (const chunk of responseChunks) {
              await message.reply(chunk);
            }
            }
            catch(error){
              console.error(error);
              message.reply('there was an error trying to execute that command!');
            }
        }
      }
    }
  }
  catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});


function splitResponse(response){
  const maxChunkLength = 2000;
  let chunks = [];

  for (let i = 0; i < response.length; i += maxChunkLength) {
    chunks.push(response.substring(i, i + maxChunkLength));
  }
  return chunks;
}
