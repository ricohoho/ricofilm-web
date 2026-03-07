const { spawn } = require('child_process');
const cp = spawn('/bin/bash', ['/home/efassel/ricofilm/ricofilm-web/app/mcp/start-bridge.sh']);
cp.stdout.on('data', d => console.log('OUT:', JSON.stringify(d.toString())));
cp.stderr.on('data', d => console.log('ERR:', JSON.stringify(d.toString())));
cp.on('close', c => console.log('CLOSED:', c));
console.log('Sending initialize...');
setTimeout(() => {
  cp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { capabilities: {}, clientInfo: { name: 'test', version: '1' }, protocolVersion: '2024-11-05' }}) + '\n');
}, 1000);
