import { spawn } from 'child_process';

// Script to automatically push appearance schema changes
async function pushSchema() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', 'db:push'], {
      stdio: ['pipe', 'inherit', 'inherit']
    });

    // Send "create table" selection for appearance_history
    child.stdin.write('\n'); // Select first option (create table)
    child.stdin.end();

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Appearance schema tables created successfully');
        resolve();
      } else {
        console.error('❌ Failed to create appearance schema');
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Error running db:push:', error);
      reject(error);
    });
  });
}

pushSchema().catch(console.error);