import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

/**
 * Log levels in order of verbosity
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private level: LogLevel = !environment.development ? LogLevel.ERROR : LogLevel.DEBUG;

  /**
   * Logs an error message
   */
  error(message: string, ...data: any[]): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Logs a warning message
   */
  warn(message: string, ...data: any[]): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs an informational message
   */
  info(message: string, ...data: any[]): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a debug message (only in development)
   */
  debug(message: string, ...data: any[]): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Sets the current log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data: any[] = []): void {
    if (level > this.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...data);
        break;
      case LogLevel.DEBUG:
        console.log(prefix, message, ...data);
        break;
    }
  }
}
