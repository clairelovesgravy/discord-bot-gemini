require ('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, Partials } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const { addThreadToPair, getOpenaiThreadId} = require('./model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run (prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}



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

authorizedUsers = ['1073103866209517618'];
authorizedChannels = ['1148830641425760259'];


client.on('messageCreate', async (message) => {
  try {
    if(message.author.bot) return;
    if (message.channel.type === ChannelType.DM && authorizedUsers.includes(message.author.id)) 
    {
      message.reply('Hey there, how can I help you?');
      // generate response from gemini api
      const prompt = message.content;
      try{
        const response = await run(prompt);
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
        try{
          const response = await run(prompt);
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