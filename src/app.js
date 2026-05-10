import cors from 'cors';
import express from 'express';

import config from './config.js';
import { decideLightCommand } from './groq.js';
import { publishCommand } from './mqttClient.js';

function parseCommand(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const command = value.trim().toLowerCase();
  return command === 'on' || command === 'off' ? command : null;
}

export function createApp() {
  const app = express();
  const api = express.Router();

  app.use(cors());
  app.use(express.json());

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  api.post('/command', async (req, res) => {
    const command = parseCommand(req.body?.command);

    if (!command) {
      return res.status(400).json({ error: 'command debe ser "on" u "off"' });
    }

    try {
      await publishCommand(command);
      return res.json({ ok: true, command, topic: config.mqtt.topic });
    } catch (err) {
      console.error(err);
      return res.status(502).json({
        error: 'No se pudo publicar en HiveMQ',
        detail: String(err?.message || err),
      });
    }
  });
  api.post('/prompt', async (req, res) => {
    const text = req.body?.text;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'El campo "text" es requerido' });
    }

    let command;
    try {
      command = await decideLightCommand(text.trim());
    } catch (err) {
      console.error(err);
      return res.status(502).json({
        error: 'Error al interpretar el prompt con Groq',
        detail: String(err?.message || err),
      });
    }

    try {
      await publishCommand(command);
      return res.json({ ok: true, command, topic: config.mqtt.topic });
    } catch (err) {
      console.error(err);
      return res.status(502).json({
        error: 'No se pudo publicar en HiveMQ',
        detail: String(err?.message || err),
      });
    }
  });

  app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend de Lamparita funcionando' });
});

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use(config.basePath, api);

  return app;
}

export default createApp;
