import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Please add it in Supabase Edge Function secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { chat } = await req.json();
    if (!chat) {
      return new Response(
        JSON.stringify({ error: "No chat text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a data extraction assistant for Pregnancy Help South Africa. Extract client information from this Facebook Messenger conversation. Return ONLY a JSON object with these keys: client_name (string or null), first_contact_date (ISO date string YYYY-MM-DD or null), age (string number or null), sex (F/M/Unknown or null), reason_for_contact (string or null), how_found_phsa (string or null), phone_number (string or null), province (string or null), notes (brief summary of the conversation or null). For reason_for_contact use one of: "Unwanted pregnancy (abortion services)", "Unwanted pregnancy (adoption services)", "Pregnancy support", "Pregnancy test", "Wanting to fall pregnant", "Post abortion counselling", "Failed abortion", "Enquiring about services", "Other". For how_found_phsa use one of: "Facebook", "Instagram", "Word of mouth", "Internet search", "Other social media", "Referral", "Other". Leave fields null if not determinable. Return only valid JSON, no markdown, no explanation. Chat: ${chat}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error: ${res.status} ${errText}`);
    }

    const anthropicData = await res.json();
    const raw = anthropicData.content?.[0]?.text ?? "{}";

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
