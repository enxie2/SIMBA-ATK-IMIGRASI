module.exports = {
  apps: [
    {
      name: 'simba-atk-imigrasi',
      script: './backend/server.js',
      cwd: '/var/www/simba-atk-imigrasi',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
