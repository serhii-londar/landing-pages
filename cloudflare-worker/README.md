# Cloudflare Worker Support Form Proxy

This Cloudflare Worker receives support ticket and feedback submissions from your static GitHub Pages landing pages and creates an issue in your GitHub repository via the GitHub REST API.

## Features
- **Zero Frontend Secrets**: Your GitHub Personal Access Token (PAT) remains strictly secure inside Cloudflare Worker environment secrets.
- **No GitHub Account Required for Users**: Mobile and web app users can submit bugs and feedback without needing a GitHub login.
- **Image & Screenshot Attachments**: Supports uploading up to 3 screenshots (PNG/JPG/WebP up to 5MB each) saved directly into the repository `attachments/` folder and embedded in the issue body.
- **Automated Multi-Labeling**: Automatically tags issues with `app:<app-name>` (e.g. `app:dota2wiki`), report type (`bug`, `enhancement`, `question`, `documentation`), and status (`status:created`).
- **Prominent UI Feedback**: Displays a dedicated, animated success card with ticket number, status pill, direct GitHub link, and a reset button to submit another ticket.
- **Formatted Issue Markdown**: Includes status line (`Status: Created`), client user agent, timestamp, optional contact email, attachments, and structured sections.
- **CORS Support**: Pre-configured to support cross-origin requests from GitHub Pages.

---

## 5-Minute Setup Guide

### 1. Create a GitHub Fine-Grained Personal Access Token (PAT)
1. Go to **GitHub** → **Settings** → **Developer Settings** → **[Fine-grained tokens](https://github.com/settings/tokens?type=beta)**.
2. Click **Generate new token**.
3. Name: `Support Form Proxy Worker`.
4. Expiration: 1 year (or custom).
5. **Repository access**: Choose **Only select repositories** → select `landing-pages` (or your issues repository).
6. **Permissions**: Under **Repository permissions**:
   - **Issues** → select **Read and write** (to create tickets)
   - **Contents** → select **Read and write** (to store uploaded screenshots/attachments)
7. Generate and copy the token (starts with `github_pat_...`).

### 2. Deploy to Cloudflare Workers (Free)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** → **Create Worker**.
3. Set worker name (e.g. `landing-pages-support-api`) and click **Deploy**.
4. Click **Edit code**, paste the contents of [`worker.js`](./worker.js), and click **Deploy**.

### 3. Add Worker Environment Variables
In your Cloudflare Worker dashboard:
1. Go to **Settings** → **Variables and Secrets**.
2. Under **Secrets**, click **Add**:
   - Variable name: `GITHUB_TOKEN`
   - Value: *(Paste your `github_pat_...` token)*
   - Click **Save and deploy**.
3. Under **Variables** (or plaintext environment variables):
   - `GITHUB_REPO_OWNER`: `serhii-londar` (or your GitHub username/org)
   - `GITHUB_REPO_NAME`: `landing-pages` (or your target repository)
   - `ALLOWED_ORIGIN`: `*` (or `https://serhii-londar.github.io` to restrict access)

### 4. Link Worker URL in Landing Pages
Update the `SUPPORT_API_ENDPOINT` constant in your support pages (`support.html`) to your worker URL:
```javascript
const SUPPORT_API_ENDPOINT = "https://landing-pages-support-api.<your-subdomain>.workers.dev";
```
