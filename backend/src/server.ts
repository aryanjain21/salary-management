import { createApp } from './app';
import { loadEnv } from './config/env';

const env = loadEnv();
const app = createApp({ corsOrigin: env.CORS_ORIGIN });

app.listen(env.PORT, () => {
  console.warn(`API listening on http://localhost:${env.PORT}`);
});
