// Shared Gemini API helper (OpenAI-compatible endpoint).
// Uses customer-owned GEMINI_API_KEY instead of the Lovable AI Gateway.

export const GEMINI_OPENAI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Map legacy model identifiers (Lovable Gateway naming) to the public Gemini API names.
export function mapModel(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  const m = model.replace(/^google\//, "");
  // Preview models that don't exist in the public API → fall back
  if (m.includes("gemini-3-flash-preview")) return "gemini-2.5-flash";
  if (m.includes("gemini-3.1-flash-image-preview")) return "gemini-2.5-flash-image";
  if (m.includes("gemini-3-pro-image-preview")) return "gemini-2.5-flash-image";
  if (m.includes("gemini-3.1-pro-preview")) return "gemini-2.5-pro";
  return m;
}

export function getGeminiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

export async function callGemini(body: Record<string, unknown>): Promise<Response> {
  const key = getGeminiKey();
  const mapped = { ...body, model: mapModel(body.model as string | undefined) };
  return await fetch(GEMINI_OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mapped),
  });
}
