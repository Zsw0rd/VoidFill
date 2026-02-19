/**
 * Gemini 2.5 Flash helper utilities.
 *
 * 2.5 Flash has a "thinking" mode that returns multi-part responses:
 *   parts[0] = { thought: true, text: "thinking..." }
 *   parts[1] = { text: "actual JSON" }
 *
 * These helpers ensure we always extract the right part.
 */

/**
 * Extract the actual response text from a Gemini API response,
 * skipping any "thinking" parts that 2.5 Flash may include.
 */
export function extractGeminiText(geminiData: any): string {
    const parts = geminiData?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts) || parts.length === 0) return "[]";

    // Find the LAST non-thinking part (the actual response)
    for (let i = parts.length - 1; i >= 0; i--) {
        if (!parts[i].thought) {
            return parts[i].text || "";
        }
    }

    // Fallback: just use the last part
    return parts[parts.length - 1].text || "";
}

/**
 * Parse a JSON array from raw Gemini output text.
 * Handles markdown fences, stray prose, trailing commas.
 */
export function parseJsonArray(rawText: string): any[] {
    const text = rawText.trim();
    if (!text) return [];

    // 1) Strip markdown fences ```json … ```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const payload = fenced?.[1]?.trim() || text;

    // 2) Find outermost [ … ]
    const start = payload.indexOf("[");
    const end = payload.lastIndexOf("]");
    if (start !== -1 && end > start) {
        const jsonStr = payload.slice(start, end + 1);
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            // Fix trailing commas and retry
            try {
                const fixed = jsonStr.replace(/,\s*([}\]])/g, "$1");
                return JSON.parse(fixed);
            } catch { /* fall through */ }
        }
    }

    // 3) Maybe it's a single object wrapped response
    const objStart = payload.indexOf("{");
    const objEnd = payload.lastIndexOf("}");
    if (objStart !== -1 && objEnd > objStart) {
        try {
            const parsed = JSON.parse(payload.slice(objStart, objEnd + 1));
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch { /* fall through */ }
    }

    // 4) Last resort: try parsing the whole thing
    try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Build the Gemini API URL for a given model.
 */
export function geminiUrl(apiKey: string, model = "gemini-2.5-flash"): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

/**
 * Call Gemini and return parsed JSON array.
 * Handles thinking blocks, markdown fences, parse errors.
 */
export async function callGeminiForJson(
    apiKey: string,
    prompt: string,
    opts?: { temperature?: number; maxTokens?: number },
): Promise<{ data: any[]; error?: string }> {
    const temperature = opts?.temperature ?? 0.7;
    const maxTokens = opts?.maxTokens ?? 4096;

    try {
        const res = await fetch(geminiUrl(apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    responseMimeType: "application/json",
                },
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Gemini API error:", res.status, errText.slice(0, 200));
            return { data: [], error: "AI service returned an error" };
        }

        const geminiData = await res.json();
        const rawText = extractGeminiText(geminiData);

        const parsed = parseJsonArray(rawText);
        if (parsed.length === 0 && rawText.length > 0) {
            console.error("Failed to parse Gemini JSON. Raw preview:", rawText.slice(0, 300));
            return { data: [], error: "Failed to parse AI response" };
        }

        return { data: parsed };
    } catch (err: any) {
        console.error("Gemini call error:", err.message);
        return { data: [], error: err.message };
    }
}
