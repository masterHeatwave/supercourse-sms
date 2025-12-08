import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private userId!: string;
  private role!: string;

  constructor() {
    this.socket = io('http://localhost:3193');

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from server:', reason);
      // Optionally notify backend explicitly
      if (this.userId && this.role) {
        this.socket.emit('userLeaving', this.role, this.userId);
      }
    });
  }

  setUser(role: string, userId: string) {
    this.role = role;
    this.userId = userId;
    this.emit('setRole', role, userId);
  }

  onOnlineUsers(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('onlineUsers', (data: any) => {
        subscriber.next(data);
      });

      // cleanup
      return () => this.socket.off('onlineUsers');
    });
  }

  on<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });

      return () => this.socket.off(eventName);
    });
  }

  emit(eventName: string, data?: any, userId?: any): void {
    this.socket.emit(eventName, data, userId);
  }
}
