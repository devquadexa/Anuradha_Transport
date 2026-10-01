require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

/**
 * Sequelize CLI configuration.
 * This file is the single source of truth for how migrations/seeders
 * connect to MySQL across environments. The backend project does NOT
 * define its own migration config - schema evolution lives here only.
 */
const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: {
    ...base,
    database: process.env.DB_NAME || 'anuradha_tms_dev',
  },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || 'anuradha_tms_test',
  },
  production: {
    ...base,
    database: process.env.DB_NAME_PROD || 'anuradha_tms',
    logging: false,
  },
};
