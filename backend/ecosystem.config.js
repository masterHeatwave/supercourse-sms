module.exports = {
  apps: [
    {
      name: 'dev-sms-api',
      script: 'npm',
      args: 'run start',
      env_file: './.env',
    },
  ],
};
