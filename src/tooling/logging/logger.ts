/**
 * Logging module using pino for structured logging.
 * Provides debug, info, warn, and error level logging with pretty formatting.
 *
 * @module logging/logger
 */

import pino from 'pino';

/**
 * Configured pino logger instance.
 * Level controlled by LOG_LEVEL environment variable (default: 'info').
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

export default logger;

/**
 * Convenience logging functions bound to the pino logger instance.
 * @example
 * ```ts
 * import { log } from './logging/logger.js';
 * log.info('Processing started');
 * log.error('Failed to process', { error: err });
 * ```
 */
export const log = {
  /** Log debug-level messages */
  debug: logger.debug.bind(logger),
  /** Log info-level messages */
  info: logger.info.bind(logger),
  /** Log warning messages */
  warn: logger.warn.bind(logger),
  /** Log error messages */
  error: logger.error.bind(logger),
};
