const REQUIRED_ENV_VARS = ['HIVEMQ_HOST', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];

function getMissingEnvVars(env) {
  return REQUIRED_ENV_VARS.filter((key) => !env[key]);
}

export function getConfig(env = process.env) {
  const missingEnvVars = getMissingEnvVars(env);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missingEnvVars.join(
        ', '
      )}. Copiá backend/.env.example a backend/.env`
    );
  }

  return {
    port: Number(env.PORT) || 3000,
    mqtt: {
      host: env.HIVEMQ_HOST,
      username: env.HIVEMQ_USERNAME,
      password: env.HIVEMQ_PASSWORD,
      topic: env.MQTT_TOPIC || 'yaguarete/fernando/luz',
      rejectUnauthorized: env.HIVEMQ_REJECT_UNAUTHORIZED === 'true',
    },
  };
}

function loadConfig() {
  try {
    return getConfig();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

export const config = loadConfig();
