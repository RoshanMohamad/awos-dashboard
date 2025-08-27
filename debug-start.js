const { spawn } = require('child_process');

console.log('Starting Next.js development server...');

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('Error starting server:', error);
});

child.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
