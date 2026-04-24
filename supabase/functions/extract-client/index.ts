import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VOLUNTEERS = [
  'Anri', 'Steph', 'Jane', 'Lynn H', 'Lyn VB',
  'Rebecca', 'Renette', 'Mandisa', 'Mari', 'Marietjie',
  'Melanie', 'Anne', 'Joan',
];

const PROVINCES = [
  'Gauteng', 'KZN', 'Free State', 'Limpopo', 'Mpumalanga',
  'Western Cape', 'Eastern Cape', 'North West', 'Northern Cape',
];

const REASONS_FOR_CONTACT = [
  'Unwanted pregnancy (abortion services)',
  'Unwanted pregnancy (adoption services)',
  'Pregnancy support',
  'Pregnancy test',
  'Wanting to fall pregnant',
  'Post abortion counselling',
  'Failed abortion',
  'Enquiring about services',
  'Other',
];

const HOW_FOUND_OPTIONS = [
  'Facebook',
  'Instagram',
  'Word of mouth',
  'Internet search',
  'Other social media',
  'Referral',
  'Other',
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured." }),
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

    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are a data extraction assistant for Pregnancy Help South Africa (PHSA). Extract client information from this Facebook Messenger conversation and return ONLY a JSON object with exactly these keys:

- clientName: string or null — the client's full name
- firstContactDate: ISO date string YYYY-MM-DD or null — date of first contact (look for date stamps in the chat)
- volunteer: string or null — the PHSA volunteer's name. Must exactly match one of: ${JSON.stringify(VOLUNTEERS)}. Null if not found or no match.
- age: string or null — client's age as a number string (e.g. "24") or "Unknown"
- sex: "F", "M", "Unknown", or null — F for female, M for male
- reasonForContact: string or null — must exactly match one of: ${JSON.stringify(REASONS_FOR_CONTACT)}. Null if no exact match.
- howFoundUs: string or null — must exactly match one of: ${JSON.stringify(HOW_FOUND_OPTIONS)}. Null if no exact match.
- phoneNumber: string or null — client's phone number
- province: string or null — must exactly match one of: ${JSON.stringify(PROVINCES)}. Null if no exact match.
- notes: string or null — a brief summary of the conversation and key details

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no code fences.
- For dropdown fields (volunteer, reasonForContact, howFoundUs, province), the value MUST exactly match one of the listed options or be null — do not guess or rephrase.
- If a field cannot be determined from the conversation, use null.

Chat:
${chat}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
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

    // Map camelCase keys → snake_case ClientInsert keys and apply defaults
    const result = {
      client_name:        (parsed.clientName as string | null) ?? null,
      first_contact_date: (parsed.firstContactDate as string | null) ?? today,
      volunteer:          (parsed.volunteer as string | null) ?? null,
      age:                (parsed.age as string | null) ?? null,
      sex:                (parsed.sex as string | null) ?? null,
      reason_for_contact: (parsed.reasonForContact as string | null) ?? null,
      how_found_us:       (parsed.howFoundUs as string | null) ?? null,
      phone_number:       (parsed.phoneNumber as string | null) ?? null,
      province:           (parsed.province as string | null) ?? null,
      notes:              (parsed.notes as string | null) ?? null,
    };

    return new Response(
      JSON.stringify(result),
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
