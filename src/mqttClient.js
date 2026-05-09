import mqtt from 'mqtt';

import { config } from './config.js';

/** @type {import('mqtt').MqttClient | null} */
let mqttClient = null;
/** @type {Promise<import('mqtt').MqttClient> | null} */
let connecting = null;

function getClient() {
  if (mqttClient?.connected) {
    return Promise.resolve(mqttClient);
  }

  if (connecting) {
    return connecting;
  }

  if (mqttClient) {
    mqttClient.removeAllListeners();
    mqttClient.end(true);
    mqttClient = null;
  }

  connecting = new Promise((resolve, reject) => {
    const client = mqtt.connect(`mqtts://${config.mqtt.host}`, {
      username: config.mqtt.username,
      password: config.mqtt.password,
      port: 8883,
      protocol: 'mqtts',
      rejectUnauthorized: config.mqtt.rejectUnauthorized,
    });

    const handleConnectionError = (err) => {
      connecting = null;
      client.end(true);
      reject(err);
    };

    client.once('connect', () => {
      client.removeListener('error', handleConnectionError);
      client.on('error', (err) => {
        console.error('Error de MQTT:', err.message);
      });
      mqttClient = client;
      connecting = null;
      resolve(client);
    });

    client.once('error', handleConnectionError);
  });

  return connecting;
}

export async function publishCommand(command) {
  const client = await getClient();

  await new Promise((resolve, reject) => {
    client.publish(config.mqtt.topic, command, { qos: 1 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
