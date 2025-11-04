module.exports = {
  apps: [
    {
      name: 'dev-sms-web',
      script: 'npm',
      args: 'run serve:ssr:supercourse-web',
      env_file: './.env'
    }
  ]
};
