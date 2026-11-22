import pino, { type Logger } from 'pino';

export function createLogger(level: pino.LevelWithSilentOrString = 'info'): Logger {
  return pino({ level });
}
