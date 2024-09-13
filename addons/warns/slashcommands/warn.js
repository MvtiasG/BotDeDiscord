const warnModel = require('../schema/warn.js')
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')

module.exports = {
  data: {
    name: 'sancionar',
    description: 'Sistema de sanciones',
    dm_permission: false,
    options: [{
  		name: "add",
  		description: "Sancionar a un usuario",
  		type: 1,
  		options: [{
  			name: "user",
  			description: "Nombre del usuario",
  			type: 6,
  			required: true
  		},{
  			name: "reason",
  			description: "Razón de la sanción",
  			type: 3,
			required: true
  		},{
  			name: "pruebas",
  			description: "Pruebas de la sanción",
  			type: 3,
  			required: true
  		
		}],
  	},{
  		name: "list",
  		description: "Lista de las sanciones",
  		type: 1,
  		options: [{
  			name: "user",
  			description: "Nombre del Usuario",
  			type: 6,
  			required: true
  		}],
  	}],
  },
	async execute(interaction) {
		try {
			const { user, guild, options, client } = interaction
			const targetUser = options.getUser('user')
			if (!targetUser) {
			  return interaction.reply({ content: 'No se pudo encontrar el usuario especificado.', ephemeral: true })
			}
			const reason = options.getString('reason') || 'No reason'
			const pruebas = options.getString('pruebas') || 'No pruebas'
	
			const rolAutorizado = ['1117611457123733588'];
	
			const member = interaction.member;
			const tieneUnRolAutorizado = member.roles.cache.some(role => rolAutorizado.includes(role.id));
			if (!tieneUnRolAutorizado) {
			  return interaction.reply('No tienes permiso para usar este comando!');
			}
			
			let userModel = await warnModel.findOneAndUpdate(
			  { user: targetUser.id, guild: guild.id },
			  {},
			  { new: true, upsert: true }
			)
	  
			if (options.getSubcommand() == 'add') {
			  userModel.warns.push({
				name: targetUser.username,
				reason: reason,
				pruebas: pruebas,
				author: user.id,
				created: interaction.createdTimestamp
			  })
		await userModel.save()
	    
	    const channelDM = await targetUser.createDM({ force: true })
	    let notified = '✅'
	    await channelDM.send({
	      embeds: [new EmbedBuilder ()
			.setDescription(`**Has sido sancionado en __${guild.name}__**!` +
			`\n\nSanción número: **${userModel.warns.length}**` +
			`\nRazón: **${reason}**` +
			`\nMiembro del staff: ${user} (${user.id})`+
			`\nPruebas: **${pruebas}**`)
		.setColor("#d4a20f")]
	    }).catch(error => notified = ':x:')
	    
	    interaction.reply({
	      embeds: [new EmbedBuilder()
	        .setAuthor({ name: 'Sistema de sanciones', iconURL: client.user.displayAvatarURL() })
			.setDescription(`El usuario fue sancionado correctamente!` +
			`\n\nSanción número: **${userModel.warns.length}**` +
			`\nUsuario: ${targetUser.tag}` +
			`\nID Discord: (${targetUser.id})` +
			`\nRazón: **${reason}** \nMiembro del Staff: ${user}` +
			`\nPruebas: [Haz clic aquí para ver las pruebas] ${pruebas}` +
			`\nNotificado: ${notified}`)
		.setColor("#d4a20f")
		.setTimestamp()
		.setFooter({ text: guild.name, iconURL: guild.iconURL()})]
	    })
	} else if (options.getSubcommand() == 'list') {
        if (!userModel || userModel.warns.length == 0) return interaction.reply({
          content: 'El usuario no tiene ninguna sanción registrada.',
          ephemeral: false
        })
        
        menu(interaction, userModel.warns, 0, userModel)
      }
    } catch (error) {
      console.error(error)
      interaction.reply({ content: 'Ocurrió un error al procesar la solicitud.', ephemeral: false })
    }
  }
}

async function menu(interaction, content, page, model){
	const embed = buildEmbed(content, page, model);
	const actionRow = buildActionRow(page, content.length);
  
	try{
	  await interaction.reply({embeds: [embed], components: [actionRow], ephemeral: false});
	}catch{
	  await interaction.editReply({embeds: [embed], components: [actionRow], ephemeral: false});
	}
  
	await handleInteraction(interaction, content, page, model);
  }
  
  function buildEmbed(content, page, model) {
	return new EmbedBuilder()
	  .setTitle(`Sanción número ${page + 1} de ${content.length}`)
	  .setDescription(`User: ${content[page].name} (${model.user})` +
		`\nRazón: ${content[page].reason}` +
		`\nFecha: <t:${Math.floor(content[page].created / 1000)}:R>` +
		`\nAutor: <@${content[page].author}>`+
		`\nPruebas: ${content[page].pruebas}`)
	  .setColor("#d4a20f");
  }
  
  function buildActionRow(page, length) {
	const previous = new ButtonBuilder()
	  .setCustomId("Previous")
	  .setStyle("Primary")
	  .setLabel("Previo")
	  .setEmoji("⬅️");
  
	if(page == 0) previous.setDisabled(true);
  
	const next = new ButtonBuilder()
	  .setCustomId("Next")
	  .setStyle("Primary")
	  .setLabel("Siguiente")
	  .setEmoji("➡️");
  
	if(length - 1 == page) next.setDisabled(true);
  
	const revoke = new ButtonBuilder()
	  .setCustomId("revoke")
	  .setStyle("Danger")
	  .setLabel("Revocar Sanción");
  
	return new ActionRowBuilder().addComponents(previous, revoke, next);
  }
  
  async function handleInteraction(interaction, content, page, model) {
	const fetchReply = await interaction.fetchReply();
	await fetchReply.channel.awaitMessageComponent({
	  filter: (i) => (i.customId == "Previous" || i.customId == "revoke" || i.customId == "Next" ) && interaction.user.id == i.user.id && fetchReply.id == i.message.id,
	  time: 30000
	}).then((x) => {
	  x.deferUpdate()
	  if(x.customId == "Previous" && page != 0) return menu(interaction, content, page - 1, model);
  
	  if(x.customId == "Next" && page < content.length) return menu(interaction, content, page + 1, model);
  
	  if(x.customId == "revoke") {
		model.warns.remove(content[page])
		model.save()
		fetchReply.embeds[0].data.title = 'Sanción revocada por ' + x.user.tag + ' (' + x.user.id + ')';
		interaction.editReply({ embeds: [fetchReply.embeds[0]], components: []})
	  }
	}).catch(e => {
	  const rowDisabled = new ActionRowBuilder();
	  fetchReply.components[0].components.map(x => {
		x.data.disabled = true 
		rowDisabled.addComponents(x);
	  })
	  interaction.editReply({ embeds: [fetchReply.embeds[0]], components: [rowDisabled]});
	});
  }