export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      let data = {};

      if (contentType.includes("application/json")) {
        data = await request.json();
      } else if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        return json(
          { ok: false, error: "Unsupported content type" },
          corsHeaders,
          400,
        );
      }

      const name = String(data.name || "").trim();
      const email = String(data.email || "").trim();
      const company = String(data.company || "").trim();
      const engagementMode = String(
        data.engagementMode || data.engagement_mode || "",
      ).trim();
      const brief = String(data.brief || "").trim();
      const website = String(data.website || "").trim();

      if (website) {
        return json({ ok: true }, corsHeaders);
      }

      if (!name || !email || !brief) {
        return json(
          { ok: false, error: "Missing required fields" },
          corsHeaders,
          400,
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return json(
          { ok: false, error: "Invalid email address" },
          corsHeaders,
          400,
        );
      }

      if (!env.BIRD_API_KEY) {
        console.log("Missing BIRD_API_KEY secret");
        return json(
          { ok: false, error: "Server not configured" },
          corsHeaders,
          500,
        );
      }

      const birdEndpoint = "https://eu1.platform.bird.com/v1/email/messages";

      const subject = engagementMode
        ? `New studio enquiry — ${engagementMode}`
        : "New studio enquiry";

      const textBody = [
        "New enquiry from backrobbinpeez.com",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "-"}`,
        `Engagement mode: ${engagementMode || "-"}`,
        "",
        "Brief:",
        brief,
      ].join("\n");

      const htmlBody = `
        <h2>New studio enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || "-")}</p>
        <p><strong>Engagement mode:</strong> ${escapeHtml(engagementMode || "-")}</p>
        <p><strong>Brief:</strong></p>
        <p>${escapeHtml(brief).replace(/\n/g, "<br>")}</p>
      `;

      const birdPayload = {
        from: {
          email: "hello@backrobbinpeez.studio",
          name: "Back Robbin' Peez",
        },
        to: [
          {
            email: "hello@backrobbinpeez.studio",
            name: "Robin",
          },
        ],
        subject,
        text: textBody,
        html: htmlBody,
      };

      const birdRes = await fetch(birdEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.BIRD_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(birdPayload),
      });

      const birdText = await birdRes.text();
      console.log("bird send status", birdRes.status, birdText);

      if (!birdRes.ok) {
        return json(
          {
            ok: false,
            error: "Bird send failed",
            details: birdText,
          },
          corsHeaders,
          502,
        );
      }

      return json({ ok: true }, corsHeaders);
    } catch (err) {
      console.log("worker error", err?.message || String(err));
      return json(
        { ok: false, error: "Unexpected server error" },
        corsHeaders,
        500,
      );
    }
  },
};

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
