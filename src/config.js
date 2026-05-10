const REQUIRED_ENV_VARS = ['HIVEMQ_HOST', 'HIVEMQ_USERNAME', 'HIVEMQ_PASSWORD'];

function hasGroqApiKey(env) {
  return Boolean(env.GROQ_API_KEY);
}

function getMissingEnvVars(env) {
  const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !env[key]);

  if (!hasGroqApiKey(env)) {
    missingEnvVars.push('GROQ_API_KEY');
  }

  return missingEnvVars;
}

function normalizeBasePath(value) {
  const path = value?.trim() || '/api';

  if (path === '/') {
    return path;
  }

  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

export function getConfig(env = process.env) {
  const missingEnvVars = getMissingEnvVars(env);

  // Solo lanzamos error si no estamos en Vercel (producción)
  // En producción, si faltan, el error se verá en los logs al intentar conectar a MQTT
  if (missingEnvVars.length > 0 && env.NODE_ENV !== 'production') {
    throw new Error(
      `Faltan variables de entorno: ${missingEnvVars.join(
        ', '
      )}. Revisá tu archivo .env local.`
    );
  }

  return {
    // Vercel asigna el puerto automáticamente, por eso priorizamos process.env.PORT
    port: Number(env.PORT) || 3000,
    basePath: normalizeBasePath(env.BACKEND_BASE_PATH),
    isProduction: env.NODE_ENV === 'production',
    mqtt: {
      host: env.HIVEMQ_HOST,
      username: env.HIVEMQ_USERNAME,
      password: env.HIVEMQ_PASSWORD,
      topic: env.MQTT_TOPIC || 'yaguarete/fernando/luz',
      // En producción suele ser true, en local false si usás certificados auto-firmados
      rejectUnauthorized: env.HIVEMQ_REJECT_UNAUTHORIZED !== 'false',
    },
    groqApiKey: env.GROQ_API_KEY,
    groqModel: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    groqBaseUrl: env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  };
}

function loadConfig() {
  try {
    return getConfig();
  } catch (err) {
    // Solo matamos el proceso en local
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Error de configuración:', err.message);
      process.exit(1);
    }
    return getConfig(); // En prod intentamos cargar lo que haya
  }
}

const config = loadConfig();

export { config };
export default config;