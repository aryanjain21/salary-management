import { setupServer } from 'msw/node';

/**
 * Network-level API mock shared by all tests. Tests register the handlers
 * they need with `server.use(...)`; unhandled requests fail the test.
 */
export const server = setupServer();
