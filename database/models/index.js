'use strict';

/**
 * Minimal Sequelize model loader used ONLY by sequelize-cli (e.g. for
 * `seed:generate` context) and for local verification scripts in this
 * project. The backend API defines and owns its own Sequelize model
 * layer independently (infrastructure/database/sequelize/models) so the
 * two projects stay decoupled - this file is not imported by the backend.
 */
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
