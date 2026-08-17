/**
 * Cloudflare Worker: GitHub Issues Support Form Proxy
 * 
 * Proxies support requests submitted from static landing pages hosted on GitHub Pages
 * directly to GitHub Issues API, automatically attaching app & report type labels.
 */

export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight and headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    try {
      const data = await request.json();
      const { app, reportType, title, email, description, systemInfo } = data;

      // 2. Validate input
      if (!title || !title.trim()) {
        return new Response(JSON.stringify({ error: "Subject / Title is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!description || !description.trim()) {
        return new Response(JSON.stringify({ error: "Description is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const cleanApp = (app || "general").toLowerCase().replace(/[^a-z0-9-_]/g, "");
      const cleanType = (reportType || "bug").toLowerCase().replace(/[^a-z0-9-_]/g, "");

      // 3. Assemble Labels (e.g. ['app:dota2wiki', 'bug', 'status:created'])
      const statusLabel = env.DEFAULT_STATUS_LABEL || "status:created";
      const labels = [`app:${cleanApp}`, cleanType, statusLabel];

      // 4. Format GitHub Issue Body
      const issueBody = `### 📋 Ticket Information
- **Application:** \`${cleanApp}\`
- **Report Type:** \`${cleanType}\`
- **Status:** \`Created\`
- **User Contact:** ${email && email.trim() ? `\`${email.trim()}\`` : '_Anonymous (No email provided)_'}
- **Client System:** ${systemInfo ? `\`${systemInfo}\`` : '_Not available_'}
- **Submitted At:** \`${new Date().toISOString()}\`

---

### 📝 Description & Details
${description.trim()}

---
*Generated automatically via [App Support Form](https://github.com/${env.GITHUB_REPO_OWNER || "serhii-londar"}/${env.GITHUB_REPO_NAME || "landing-pages"})*`;

      // 5. GitHub API Configuration
      const REPO_OWNER = env.GITHUB_REPO_OWNER || "serhii-londar";
      const REPO_NAME = env.GITHUB_REPO_NAME || "landing-pages";
      const GITHUB_TOKEN = env.GITHUB_TOKEN;

      if (!GITHUB_TOKEN) {
        return new Response(JSON.stringify({ 
          error: "Worker is not configured with GITHUB_TOKEN secret. Please configure it in Cloudflare settings." 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // 6. Post issue to GitHub
      const githubResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "LandingPages-Support-Worker",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        body: JSON.stringify({
          title: `[${cleanApp.toUpperCase()}] ${title.trim()}`,
          body: issueBody,
          labels: labels
        })
      });

      const responseData = await githubResponse.json();

      if (!githubResponse.ok) {
        console.error("GitHub API Error:", responseData);
        return new Response(JSON.stringify({ 
          error: responseData.message || "Failed to create issue on GitHub." 
        }), {
          status: githubResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        issueNumber: responseData.number,
        issueUrl: responseData.html_url
      }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Worker Execution Error:", err);
      return new Response(JSON.stringify({ error: err.message || "Unexpected server error." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
