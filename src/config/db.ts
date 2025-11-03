export default () => ({
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_SYNC: process.env.DB_SYNC === 'true',
  DB_LOGGING: process.env.DB_LOGGING === 'true',
  DB_SSL: process.env.DB_SSL,
});
