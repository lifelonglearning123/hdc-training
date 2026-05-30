// Vercel serverless function — POST /api/contact
// Receives website contact-form submissions and creates a contact in GoHighLevel.
//
// Required env vars (set in Vercel dashboard for production):
//   GHL_LOCATION_ID   — the GHL sub-account/location ID
//   GHL_AUTH_TOKEN    — Private Integration Token with `contacts.write` scope

const GHL_API = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

module.exports = async function handler(req, res) {
  // CORS — same-origin only, but allow preflight for safety
  res.setHeader("Access-Control-Allow-Origin", "");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const {
    name = "",
    email = "",
    phone = "",
    organisation = "",
    service = "",
    message = "",
    hp = "",
  } = body;

  // Honeypot — silent success so bots don't retry
  if (hp) return res.status(200).json({ ok: true });

  // Basic validation
  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const locationId = process.env.GHL_LOCATION_ID;
  const authToken = process.env.GHL_AUTH_TOKEN;
  if (!locationId || !authToken) {
    console.error("GHL credentials missing from environment");
    return res.status(500).json({ error: "Server is not configured. Please email us directly." });
  }

  const [firstName, ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ") || "";

  const serviceTag = service ? `service:${service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : null;
  const tags = ["website-contact-form", serviceTag].filter(Boolean);

  try {
    // 1. Upsert contact
    const upsertRes = await fetch(`${GHL_API}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        firstName,
        lastName,
        email: email.trim(),
        phone: phone.trim() || undefined,
        companyName: organisation.trim() || undefined,
        source: "Website contact form",
        tags,
      }),
    });

    const upsertData = await upsertRes.json().catch(() => ({}));

    if (!upsertRes.ok) {
      console.error("GHL upsert failed:", upsertRes.status, upsertData);
      return res.status(502).json({ error: "We couldn't save your message. Please email info@hdconsultants.org.uk." });
    }

    const contactId = upsertData.contact?.id || upsertData.id;

    // 2. Attach the message as a note (non-critical — don't fail if this fails)
    if (contactId && message.trim()) {
      const noteBody = service
        ? `Service interest: ${service}\n\n${message.trim()}`
        : message.trim();

      fetch(`${GHL_API}/contacts/${contactId}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Version: GHL_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: noteBody }),
      }).catch((err) => console.error("Note attach failed (non-critical):", err));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact submission error:", err);
    return res.status(500).json({ error: "Submission failed. Please email info@hdconsultants.org.uk." });
  }
};
