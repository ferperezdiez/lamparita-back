import 'dotenv/config';

import { createApp } from './app.js';
import config from './config.js';

const app = createApp();

if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`API en http://localhost:${config.port}${config.basePath}`);
  });
}

export default app;