import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:3000';

export class SocketConnection {
  private static instance: SocketConnection;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketConnection {
    if (!SocketConnection.instance) {
      SocketConnection.instance = new SocketConnection();
    }
    
    return SocketConnection.instance;
  }

  public connect(token: string): Socket {
    if (!this.socket) {
      this.socket = io(URL, {
        auth: {
          token
        }
      })
    }

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
