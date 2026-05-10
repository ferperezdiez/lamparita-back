import config from './config.js';

const SYSTEM_PROMPT = `Eres un asistente que controla las luces de una habitación.
Tu única tarea es decidir si se debe prender o apagar la luz en base al mensaje del usuario.
Responde ÚNICAMENTE con la palabra "on" si la luz debe prenderse, o "off" si debe apagarse.
No respondas nada más. Solo "on" o "off".`;

/**
 * Recibe un texto en lenguaje natural y devuelve "on" u "off".
 * @param {string} prompt
 * @returns {Promise<"on" | "off">}
 */
export async function decideLightCommand(prompt) {
  if (!config.groqApiKey) {
    throw new Error('Falta configurar GROQ_API_KEY en el backend');
  }

  const response = await fetch(`${config.groqBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      max_completion_tokens: 5,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      JSON.stringify(data) ||
      response.statusText;
    throw new Error(`Groq respondió con error ${response.status}: ${detail}`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim().toLowerCase();

  if (text === 'on' || text === 'off') {
    return text;
  }

  // Si Groq devolvió algo inesperado, intentamos detectar la intención en la respuesta.
  if (text?.includes('on')) return 'on';
  if (text?.includes('off')) return 'off';

  throw new Error(`Respuesta inesperada de Groq: "${text || ''}"`);
}
