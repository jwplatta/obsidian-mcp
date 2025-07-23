// Global test setup
import { jest } from '@jest/globals';
jest.setTimeout(10000);
process.env.OBSIDIAN_API_KEY = 'test-api-key';
process.env.OBSIDIAN_API_URL = 'https://127.0.0.1:27124';
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
