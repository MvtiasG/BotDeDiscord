const { Schema, model } = require('mongoose');

const warn = Schema({
  user: { type: String },
  guild: { type: String },
	warns:  { type: Array },
});

module.exports = model('warn', warn);