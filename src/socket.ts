import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';

export const socket = io(URL, {
  autoConnect: false
});


export function connect() {
  socket.connect();
}

export function disconnect() {
  socket.disconnect();
}
