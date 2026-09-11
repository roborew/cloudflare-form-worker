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
      const data = await request.json();

      const name = data.name?.trim() || "";
      const email = data.email?.trim() || "";
      const company = data.company?.trim() || "";
      const engagementMode = data.engagementMode?.trim() || "";
      const brief = data.brief?.trim() || "";
      const website = data.website?.trim() || ""; // honeypot

      if (website) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!name || !email || !brief) {
        return new Response(
          JSON.stringify({ ok: false, error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      console.log("New contact form submission", {
        name,
        email,
        company,
        engagementMode,
        brief,
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid request" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
  },
};
