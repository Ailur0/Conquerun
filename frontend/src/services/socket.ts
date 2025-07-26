import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Adjust if backend runs elsewhere

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
});
