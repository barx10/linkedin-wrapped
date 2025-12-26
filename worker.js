// worker.js  |  Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/rewind") return new Response("Not found", { status: 404 });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const { input } = await request.json();

    const prompt = `
Skriv en norsk årsoppsummering for ${input.name} i ${input.year}.
Stil: ${input.voice}.
Rolle/arena: ${input.role}.
Topp tema: ${input.topTheme}.
Nøkkeltall: ${input.metric}.
Høydepunkter:
${(input.highlights || []).map(x => "- " + x).join("\n")}

Returner kun JSON med feltene:
superpower (kort, 1 til 3 ord),
vibe (kort, 1 til 3 ord),
post (klar for å postes, maks 1200 tegn).
`.trim();

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        response_format: { type: "json_object" }
      })
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(t || "Upstream error", { status: 502 });
    }

    const data = await r.json();
    const text = data.output_text || "{}";

    return new Response(text, {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}
