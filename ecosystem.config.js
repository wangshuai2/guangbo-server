module.exports = {
  apps: [
    {
      name: 'guangbo-backend',
      script: './dist/main.js',
      instances: 'max', // 根据 CPU 核心数启动实例数，或设置为具体数字如 2
      exec_mode: 'cluster', // 集群模式
      max_memory_restart: '1G', // 内存超过 1G 时重启
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 自动重启配置
      autorestart: true,
      restart_delay: 3000, // 重启延迟 3 秒
      max_restarts: 10, // 最大重启次数
      min_uptime: '10s', // 最小运行时间
      // 监控配置
      watch: false, // 生产环境不开启文件监听
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      // 健康检查
      health_check_grace_period: 30000,
      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],

  deploy: {
    production: {
      user: 'root',
      host: ['39.105.14.73'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/guangbo-server.git',
      path: '/data/guangbo-server',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no',
    },
  },
};
