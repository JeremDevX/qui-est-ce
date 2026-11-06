import { startServer } from './server.ts';
const server = await startServer(3001);
console.log(`QUI-EST-CE server listening on ws://localhost:${server.port}/ws`);
