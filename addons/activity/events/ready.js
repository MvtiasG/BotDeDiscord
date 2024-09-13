const { ActivityType } = require('discord.js')

const activity = [{
  status: 'online',
  text: `Bot de sanciones - 2024`,
  type: ActivityType.Playing,
}]

module.exports = {
  name: 'ready',
  once: true,
  execute: client => {
    setInterval(() => {      
      const random = Math.floor(Math.random() * activity.length);
      client.user.setStatus(activity[random].status);
      client.user.setActivity(activity[random].text, { type: activity[random].type });
    }, 20000);
  }
}