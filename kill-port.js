const { exec } = require('child_process');

console.log('� Killing all Node.js processes...');

// Try different methods to kill Node.js processes
const commands = [
  'taskkill /IM node.exe /F',
  'taskkill /IM nodemon.exe /F',
  'wmic process where "name=\'node.exe\'" delete',
  'wmic process where "name=\'nodemon.exe\'" delete'
];

let commandIndex = 0;

function tryNextCommand() {
  if (commandIndex >= commands.length) {
    console.log('✅ Finished attempting to kill Node.js processes');
    console.log('🚀 Now try starting your backend server again');
    return;
  }

  const command = commands[commandIndex];
  console.log(`⚡ Trying: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Command failed: ${error.message}`);
    } else {
      console.log(`✅ Command executed successfully`);
      if (stdout) console.log(stdout);
    }

    commandIndex++;
    setTimeout(tryNextCommand, 1000); // Wait 1 second between commands
  });
}

tryNextCommand();
