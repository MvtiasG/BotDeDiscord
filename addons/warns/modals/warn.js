const warnModel = require('../schema/warn.js')
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'warn',
  async execute(interaction) {
    try {
      const { fields, client, user, guild } = interaction
      if (!client.warnData.has(user.id)) return
      const { channel, targetUser, targetMember } = client.warnData.get(user.id)
      client.warnData.delete(user.id)
      
      let userModel = await warnModel.findOne({ user: targetUser.id, guild: guild.id })
      if (!userModel) userModel = await warnModel.create({ user: targetUser.id, guild: guild.id })
      
      const reason = fields.getTextInputValue('reason')
      
      userModel.warns.push({
        name: targetUser.username,
        reason: reason,
        prueba: prueba,
        author: user.id,
        created: interaction.createdTimestamp
      })
      await userModel.save()
      
      const channelDM = await targetUser.createDM({ force: true })
      let notified = '✅'
      await channelDM.send({
        embeds: [createEmbed(guild, userModel, reason, user, prueba, notified)]
      }).catch(error => notified = ':x:')
      
      interaction.reply({
        embeds: [createEmbed(guild, userModel, reason, user, prueba, notified)]
      })
    } catch (error) {
      console.error(error)
    }
  }
}

function createEmbed(guild, userModel, reason, user, prueba, notified) {
  return new EmbedBuilder()
    .setAuthor({ name: 'Sistema de Sanciones', iconURL: client.user.displayAvatarURL() })
    .setDescription(`El usuario que ha mencionado ha sido sancionado con éxito!` +
      `\n\nSanción número: **${userModel.warns.length}**` +
      `\nUsuario: ${targetUser.tag} (${targetUser.id})` +
      `\nRazón: **${reason}** \nMiembro del Staff: ${user}` +
      `\nNotificado: ${notified}`+
      `\nPruebas: **${prueba}**`)
    .setColor("#2f3136")
    .setTimestamp()
    .setFooter({ text: guild.name, iconURL: guild.iconURL()})
}