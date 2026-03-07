const { spawn } = require('child_process');
const cp = spawn('/home/efassel/.nvm/versions/node/v22.20.0/bin/node', ['/home/efassel/ricofilm/ricofilm-web/app/mcp/mcp-bridge.js']);
cp.stdout.on('data', d => console.log('OUT:', d.toString()));
cp.stderr.on('data', d => console.log('ERR:', d.toString()));
cp.on('close', c => console.log('CLOSED:', c));
console.log('Sending initialize...');
setTimeout(() => {
  cp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: {}, clientInfo: { name: 'test', version: '1' }, protocolVersion: '2024-11-05' }}) + '\n');
}, 1000);
