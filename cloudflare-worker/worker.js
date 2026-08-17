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
      const { app, reportType, title, email, description, systemInfo, images } = data;

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

      // 3. Assemble Labels
      const statusLabel = env.DEFAULT_STATUS_LABEL || "status:created";
      const labels = [`app:${cleanApp}`, cleanType, statusLabel];

      // 4. GitHub API Configuration
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

      // 5. Upload Image Attachments (if any) via GitHub Contents API
      const uploadedImageUrls = [];
      const uploadErrors = [];

      if (Array.isArray(images) && images.length > 0) {
        const now = new Date();
        const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        for (let i = 0; i < Math.min(images.length, 3); i++) {
          const img = images[i];
          if (!img || !img.base64) continue;

          try {
            // Extract pure base64 string safely regardless of mime type prefix
            const cleanBase64 = (img.base64 && img.base64.includes(";base64,"))
              ? img.base64.split(";base64,")[1]
              : (img.base64 || "");

            if (!cleanBase64) {
              uploadErrors.push(`Image #${i + 1} (${img.name || 'unnamed'}) had empty base64 data.`);
              continue;
            }

            const rawExt = (img.name && img.name.includes('.')) ? img.name.split('.').pop().toLowerCase() : 'png';
            const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(rawExt) ? rawExt : 'png';
            const safeFileName = `ticket-${Date.now()}-${i + 1}.${safeExt}`;
            const filePath = `attachments/${dateFolder}/${safeFileName}`;

            const uploadRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github+json",
                "User-Agent": "LandingPages-Support-Worker",
                "X-GitHub-Api-Version": "2022-11-28"
              },
              body: JSON.stringify({
                message: `Upload support attachment: ${safeFileName}`,
                content: cleanBase64.trim(),
                branch: env.GITHUB_BRANCH || "main"
              })
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              const rawUrl = uploadData.content?.download_url || 
                `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${env.GITHUB_BRANCH || "main"}/${filePath}`;
              uploadedImageUrls.push({ name: img.name || safeFileName, url: rawUrl });
            } else {
              const errBody = await uploadRes.text();
              const errMsg = `GitHub Contents API HTTP ${uploadRes.status}: ${errBody}`;
              console.error(errMsg);
              uploadErrors.push(`Failed to attach "${img.name || safeFileName}": ${errMsg}`);
            }
          } catch (imgErr) {
            console.error("Failed to process image attachment:", imgErr);
            uploadErrors.push(`Error processing "${img.name || 'image'}": ${imgErr.message}`);
          }
        }
      }

      // 6. Build Issue Body with Attachments
      let issueBody = `### 📋 Ticket Information
- **Application:** \`${(app || "general").trim()}\`
- **Report Type:** \`${(reportType || "bug")}\`
- **Status:** \`Created\`
- **User Contact:** ${email && email.trim() ? `\`${email.trim()}\`` : "_Anonymous (No email provided)_"}
- **Client System:** ${systemInfo && systemInfo.trim() ? `\`${systemInfo.trim()}\`` : "_Not available_"}
- **Submitted At:** \`${new Date().toISOString()}\`

---

### 📝 Description & Details
${description.trim()}`;

      if (uploadedImageUrls.length > 0) {
        issueBody += `\n\n---\n\n### 📸 Attachments & Screenshots\n`;
        uploadedImageUrls.forEach((img, idx) => {
          issueBody += `\n**Screenshot ${idx + 1} (${img.name})**:\n![${img.name}](${img.url})\n`;
        });
      }

      if (uploadErrors.length > 0) {
        issueBody += `\n\n---\n\n### ⚠️ Attachment Upload Diagnostics\n`;
        uploadErrors.forEach(err => {
          issueBody += `- ${err}\n`;
        });
      }

      issueBody += `\n\n---\n*Generated automatically via [App Support Form](https://github.com/${REPO_OWNER}/${REPO_NAME})*`;

      // 7. Post issue to GitHub
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
