export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] \x1b[33m${message}\x1b[0m`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] \x1b[31m${message}\x1b[0m`, ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(`[SUCCESS] [${new Date().toISOString()}] \x1b[32m${message}\x1b[0m`, ...args);
  }
};
