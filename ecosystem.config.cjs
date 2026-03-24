module.exports = {
  apps: [
    {
      name: 'ax-connect',
      cwd: '/var/www/ax-connect',
      script: 'bun',
      args: 'run start:web',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
}
