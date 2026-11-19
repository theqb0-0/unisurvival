import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-2.5-flash";
const DAILY_CAP = 15;
const MAX_TEXT_LENGTH = 4000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ReceiptItem = {
  name: string;
  qty?: number;
  price?: number;
};

type ReceiptParse = {
  store: string;
  date: string;
  total: number;
  currency: "ZAR";
  items: ReceiptItem[];
};

type ReceiptResponse = ReceiptParse & {
  needsReview?: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function scrubSensitiveText(text: string): string {
  let out = text.replace(/\d{13,19}/g, "[redacted]");
  out = out.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[redacted]",
  );
  out = out.replace(
    /(?:\+27|0)[\s\-()]*\d[\d\s\-()]{7,12}\d/g,
    "[redacted]",
  );
  out = out.replace(
    /\b(?:\+?\d{1,3}[\s\-().]*)?(?:\d[\s\-().]*){8,14}\d\b/g,
    "[redacted]",
  );
  return out;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateReceiptParse(
  raw: unknown,
): { ok: true; data: ReceiptParse } | { ok: false; error: string } {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid response shape" };
  }
  const o = raw as Record<string, unknown>;

  if (typeof o.store !== "string" || !o.store.trim()) {
    return { ok: false, error: "Missing or invalid store" };
  }
  if (typeof o.date !== "string" || !DATE_RE.test(o.date)) {
    return { ok: false, error: "Missing or invalid date (YYYY-MM-DD)" };
  }
  if (typeof o.total !== "number" || !Number.isFinite(o.total) || o.total <= 0) {
    return { ok: false, error: "Missing or invalid total" };
  }
  if (o.currency !== "ZAR") {
    return { ok: false, error: "currency must be ZAR" };
  }
  if (!Array.isArray(o.items)) {
    return { ok: false, error: "items must be an array" };
  }

  const items: ReceiptItem[] = [];
  for (const entry of o.items) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: "Invalid item" };
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.name !== "string" || !item.name.trim()) {
      return { ok: false, error: "Each item needs a name" };
    }
    const parsed: ReceiptItem = { name: item.name.trim() };
    if (item.qty !== undefined) {
      if (typeof item.qty !== "number" || !Number.isFinite(item.qty)) {
        return { ok: false, error: "Invalid item qty" };
      }
      parsed.qty = item.qty;
    }
    if (item.price !== undefined) {
      if (typeof item.price !== "number" || !Number.isFinite(item.price)) {
        return { ok: false, error: "Invalid item price" };
      }
      parsed.price = item.price;
    }
    items.push(parsed);
  }

  return {
    ok: true,
    data: {
      store: o.store.trim(),
      date: o.date,
      total: o.total,
      currency: "ZAR",
      items,
    },
  };
}

function itemLineSum(items: ReceiptItem[]): number {
  return items.reduce((acc, item) => {
    const qty = item.qty ?? 1;
    const price = item.price ?? 0;
    return acc + qty * price;
  }, 0);
}

function buildPrompt(scrubbedText: string): string {
  return `You parse South African till slip OCR text into JSON only. No markdown, no commentary.

Return exactly this JSON shape:
{
  "store": string,
  "date": "YYYY-MM-DD",
  "total": number,
  "currency": "ZAR",
  "items": [{ "name": string, "qty": number, "price": number }]
}

Rules:
- store: retailer name from the slip
- date: best guess in ISO form
- total: grand total paid (not change)
- items: line items if visible; empty array if unclear
- amounts in ZAR as numbers (no R symbol)

OCR text:
---
${scrubbedText}
---`;
}

async function callModel(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Model configuration missing");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Gemini request failed", res.status, detail.slice(0, 200));
    throw new Error("Could not read that slip right now");
  }

  const payload = await res.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Empty model response");
  }
  return text.trim();
}

async function getUsageCount(
  admin: ReturnType<typeof createClient>,
  userId: string,
  day: string,
): Promise<number> {
  const { data, error } = await admin
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    console.error("ai_usage read failed", error.message);
    throw new Error("Could not check usage limit");
  }
  return data?.count ?? 0;
}

async function incrementUsage(
  admin: ReturnType<typeof createClient>,
  userId: string,
  day: string,
  previousCount: number,
): Promise<void> {
  const { error } = await admin.from("ai_usage").upsert(
    {
      user_id: userId,
      day,
      count: previousCount + 1,
    },
    { onConflict: "user_id,day" },
  );

  if (error) {
    console.error("ai_usage write failed", error.message);
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body.text !== "string") {
    return jsonResponse({ error: "text is required" }, 400);
  }

  if (body.text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(
      { error: "text_too_long", message: "Receipt text is too long to parse." },
      400,
    );
  }

  const scrubbed = scrubSensitiveText(body.text);
  if (!scrubbed.trim()) {
    return jsonResponse(
      {
        error: "no_text",
        message: "Couldn't read that one. Try better light, or enter it by hand.",
      },
      400,
    );
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const day = todayUtc();

  let usageCount: number;
  try {
    usageCount = await getUsageCount(admin, user.id, day);
  } catch {
    return jsonResponse(
      { error: "usage_check_failed", message: "Something went wrong. Try again." },
      500,
    );
  }

  if (usageCount >= DAILY_CAP) {
    return jsonResponse(
      {
        error: "daily_limit",
        message:
          "You've hit today's receipt scan limit (15). Try again tomorrow or enter the expense by hand.",
      },
      429,
    );
  }

  let modelJson: string;
  try {
    modelJson = await callModel(buildPrompt(scrubbed));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return jsonResponse({ error: "parse_failed", message }, 502);
  }

  await incrementUsage(admin, user.id, day, usageCount);

  let parsed: unknown;
  try {
    parsed = JSON.parse(modelJson);
  } catch {
    return jsonResponse(
      { error: "invalid_model_json", message: "Could not read that slip. Try again." },
      422,
    );
  }

  const validated = validateReceiptParse(parsed);
  if (!validated.ok) {
    return jsonResponse(
      { error: "validation_failed", message: validated.error },
      422,
    );
  }

  const result: ReceiptResponse = { ...validated.data };
  if (validated.data.items.length > 0 && validated.data.total > 0) {
    const sum = itemLineSum(validated.data.items);
    const diff = Math.abs(sum - validated.data.total) / validated.data.total;
    if (diff > 0.05) {
      result.needsReview = true;
    }
  }

  return jsonResponse(result);
});