import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    // Fetch referral centres from DB for province lookup
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseKey);
    const { data: centreRows } = await db
      .from("phsa_referral_centres")
      .select("name, province");

    const centres = (centreRows ?? []) as { name: string; province: string | null }[];
    const centreNames = centres.map(c => c.name);

    // Build lookup: lowercase name → province
    const centreLookup: Record<string, string> = {};
    for (const c of centres) {
      if (c.province) centreLookup[c.name.toLowerCase()] = c.province;
    }

    const today = new Date().toISOString().split("T")[0];

    const prompt = `You are a data extraction assistant for Pregnancy Help South Africa (PHSA). Extract client information from this conversation and return ONLY a JSON object.

IMPORTANT — the chat may be in different formats:
- Facebook Messenger: "[Name]: message" or "Name\nmessage"  
- WhatsApp export: "DD Mon YYYY, HH:MM - Name: message" or lines with date/time then name then message
- Raw paste: name appears on its own line, followed by their messages
- The PHSA volunteer/staff often says "Hello [name]" or "Hi [name]" — use this to confirm the client name
- Look for the person who is NOT the PHSA volunteer/staff as the client

Return exactly these keys:
- clientName: string or null — the client's full name (the person seeking help, NOT the PHSA volunteer). Look for: standalone name lines, "[Name]:" prefix, "Hello [Name]" greetings from staff, or sender names in timestamps like "DD Mon YYYY, HH:MM - ClientName: message"
- firstContactDate: ISO date string YYYY-MM-DD or null — the date of the FIRST message in the conversation. Look carefully for date stamps like "27 May 2026", "2026-05-27", "27/05/2026" anywhere in the text
- firstContactTime: string HH:MM (24-hour) or null — the time of the FIRST message. Look for times appearing next to date stamps, e.g. "27 May 2026, 17:32" → "17:32", "2026-05-27 09:15" → "09:15", "[09:34]" → "09:34", "19:17 -" → "19:17". Always return in HH:MM 24-hour format
- age: string or null — client's age as a number string or "Unknown"
- sex: "F", "M", "Unknown", or null
- reasonForContact: string or null — must exactly match one of: ${JSON.stringify(REASONS_FOR_CONTACT)}
- howFoundUs: string or null — must exactly match one of: ${JSON.stringify(HOW_FOUND_OPTIONS)}
- phoneNumber: string or null
- province: string or null — must exactly match one of: ${JSON.stringify(PROVINCES)}
- referral1: string or null — first referral centre name mentioned. Known centres: ${JSON.stringify(centreNames.slice(0, 40))}
- referral2: string or null — second referral centre if mentioned
- notes: string or null — brief summary of the conversation

Rules:
- Return ONLY valid JSON, no markdown, no explanation, no code fences
- For dropdown fields, value MUST exactly match the listed options or be null
- If a field cannot be determined, use null
- Pay special attention to extracting the clientName and firstContactDate — these are the most important fields

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

    const referral1 = (parsed.referral1 as string | null) ?? null;
    const referral2 = (parsed.referral2 as string | null) ?? null;

    // Auto-fill province from referral centre if AI didn't find it
    let province = (parsed.province as string | null) ?? null;
    if (!province && referral1) {
      province = centreLookup[referral1.toLowerCase()] ?? null;
    }
    if (!province && referral2) {
      province = centreLookup[referral2.toLowerCase()] ?? null;
    }

    const result = {
      clientName:        (parsed.clientName as string | null) ?? null,
      firstContactDate:  (parsed.firstContactDate as string | null) ?? today,
      firstContactTime:  (parsed.firstContactTime as string | null) ?? null,
      age:               (parsed.age != null ? String(parsed.age) : null),
      sex:               (parsed.sex as string | null) ?? null,
      reasonForContact:  (parsed.reasonForContact as string | null) ?? null,
      howFoundUs:        (parsed.howFoundUs as string | null) ?? null,
      phoneNumber:       (parsed.phoneNumber as string | null) ?? null,
      province,
      referral1,
      referral2,
      notes:             (parsed.notes as string | null) ?? null,
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
