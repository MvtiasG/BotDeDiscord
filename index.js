require('dotenv').config();
const { Client, Collection } = require('discord.js');
const mongoose = require('mongoose');

const { loadAddons } = require('./utils/loadAddons');
const { botConfig } = require('./utils/config');

// Constantes para los códigos de colores
const RESET_COLOR = '\u001B[0m';
const GREEN_COLOR = '\u001B[32m';

// Crear instancia del cliente
const client = new Client(botConfig);

// Configurar propiedades del cliente
setupClientProperties(client);

// Cargar addons
loadAddons(client);

// Iniciar sesión
loginToDiscord(client);

// Manejar rechazos no manejados
handleUnhandledRejections();

// Conectar a MongoDB
connectToMongoDB();

// Funciones

function setupClientProperties(client) {
  client.info = function info(message) {
    console.log(`${GREEN_COLOR}[${new Date().toLocaleTimeString()}] ${message}${RESET_COLOR}`);
  };

  client.prefix = process.env.DEFAULT_PREFIX;
  client.commands = new Collection();
  client.slashcommands = new Collection();
  client.buttons = new Collection();
  client.selectMenus = new Collection();
  client.contextCommands = new Collection();
  client.modals = new Collection();
  client.addonEvents = new Collection();
  client.commandData = [];
}

function loginToDiscord(client) {
  client.login(process.env.TOKEN)
    .then(() => client.info(`El bot ${client.user.tag} se ha cargado correctamente.`))
    .catch((err) => {
      console.error("Error al iniciar sesión con el token proporcionado:", err);
      process.exit(1);
    });
}

function handleUnhandledRejections() {
  process.on('unhandledRejection', (error) => {
    console.error('Error no manejado:', error);
  });
}

function connectToMongoDB() {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => client.info('Conectado exitosamente a la base de datos.'))
    .catch((err) => {
      console.error(`Ocurrió un error al conectar con la base de datos.\n${err.stack}`);
      process.exit(1);
    });

  handleMongoDBEvents();
}

function handleMongoDBEvents() {
  mongoose.connection.on('err', (err) => {
    console.error(`Ocurrió un error al conectar con la base de datos.\n${err.stack}`);
  });

  mongoose.connection.on('disconnected', () => {
    client.info('Se perdió la conexión con la base de datos');
  });
}