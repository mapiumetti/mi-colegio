import * as SecureStore from 'expo-secure-store';
import type { AiProviderId } from './types';

export type AiProvider = {
  id: AiProviderId;
  nombre: string;
  web: string; // para abrir la app / web oficial
  appScheme?: string;
  conApi: boolean; // si se puede conectar con clave de API dentro de la app
  modeloPorDefecto: string;
  dondeObtenerClave?: string;
};

// Los nombres de modelo se pueden cambiar desde la pantalla de IA.
export const PROVEEDORES: AiProvider[] = [
  { id: 'claude', nombre: 'Claude', web: 'https://claude.ai', appScheme: 'claude://', conApi: true, modeloPorDefecto: 'claude-sonnet-5-5', dondeObtenerClave: 'https://console.anthropic.com' },
  { id: 'chatgpt', nombre: 'ChatGPT', web: 'https://chatgpt.com', appScheme: 'chatgpt://', conApi: true, modeloPorDefecto: 'gpt-5-mini', dondeObtenerClave: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', nombre: 'Gemini', web: 'https://gemini.google.com', conApi: true, modeloPorDefecto: 'gemini-2.5-flash', dondeObtenerClave: 'https://aistudio.google.com/apikey' },
  { id: 'grok', nombre: 'Grok', web: 'https://grok.com', conApi: true, modeloPorDefecto: 'grok-4', dondeObtenerClave: 'https://console.x.ai' },
  // Copilot no ofrece una API pública para usuarios: se abre la app o la web.
  { id: 'copilot', nombre: 'Copilot', web: 'https://copilot.microsoft.com', conApi: false, modeloPorDefecto: '' },
];

export const SISTEMA =
  'Sos un tutor amable para estudiantes de secundaria de Argentina. Respondé en español rioplatense, ' +
  'con explicaciones claras, ejemplos y pasos ordenados. Cuando te pidan un resumen, usá títulos y viñetas breves.';

const claveKey = (p: AiProviderId) => `ai-key-${p}`;
export const leerClave = (p: AiProviderId) => SecureStore.getItemAsync(claveKey(p));
export const guardarClave = (p: AiProviderId, v: string) =>
  v ? SecureStore.setItemAsync(claveKey(p), v) : SecureStore.deleteItemAsync(claveKey(p));

export type Mensaje = { role: 'user' | 'assistant'; content: string };

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Error ${res.status}`);
  return json;
}

export async function preguntar(p: AiProviderId, modelo: string, mensajes: Mensaje[]): Promise<string> {
  const clave = await leerClave(p);
  if (!clave) throw new Error('Falta cargar la clave de API de este proveedor.');

  switch (p) {
    case 'claude': {
      const j = await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
        { model: modelo, max_tokens: 2048, system: SISTEMA, messages: mensajes },
      );
      return (j.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n');
    }
    case 'chatgpt':
    case 'grok': {
      const url = p === 'chatgpt' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
      const j = await postJson(url, { Authorization: `Bearer ${clave}` }, {
        model: modelo,
        messages: [{ role: 'system', content: SISTEMA }, ...mensajes],
      });
      return j.choices?.[0]?.message?.content ?? '';
    }
    case 'gemini': {
      const j = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
        { 'x-goog-api-key': clave },
        {
          systemInstruction: { parts: [{ text: SISTEMA }] },
          contents: mensajes.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        },
      );
      return (j.candidates?.[0]?.content?.parts ?? []).map((x: { text?: string }) => x.text ?? '').join('');
    }
    default:
      throw new Error('Este proveedor se usa abriendo su app.');
  }
}
