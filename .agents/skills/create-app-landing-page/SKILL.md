---
name: create-app-landing-page
description: >-
  Create high-converting, App Store-compliant, and beautifully designed dark-mode landing pages for mobile and desktop applications.
  Use this skill whenever creating a new app landing page, adding legal/support pages (privacy policy, terms, support FAQ), or standardizing app web structures.
---

# App Landing Page Generator Skill

This skill provides a standardized, battle-tested blueprint for creating production-ready, App Store-compliant, and visually stunning landing pages for native iOS, iPadOS, macOS, Android, and web applications.

## App Folder Architecture

Every app landing page must be contained in its own folder under the repository root (e.g., `my-app/`) with the following standardized files:

```text
<app-folder-name>/
├── index.html            # Main landing page (Hero, Features, Screenshots Showcase, CTA, App Store Badges)
├── index.css             # Self-contained dark-mode design system & animations
├── support.html          # Support & Help Center (Direct contact cards, FAQ accordion, App Specs)
├── privacy-policy.html   # Styled HTML Privacy Policy (App Store Review Guideline 5.1.1 compliant)
├── privacy-policy.md     # Plain Markdown Privacy Policy
├── terms.html            # Styled HTML Terms of Service / End User License Agreement
├── terms.md              # Plain Markdown Terms of Service
└── assets/               # or images/
    ├── app_icon.png      # High-resolution app icon (1024x1024 or 512x512)
    └── screenshots/      # iPhone / iPad / Mac device screenshots
```

---

## Step-by-Step Generation Workflow

### Step 1: Collect App Information
Gather the essential information before generating files:
1. **App Identity**: Name, tagline, description, primary color palette, and app icon.
2. **App Store Info**: App Store URL / ID (e.g. `1591660057` for Smart App Banner `<meta name="apple-itunes-app" content="app-id=...">`).
3. **Key Features**: 4–6 core features with emojis/icons, titles, and concise benefit descriptions.
4. **Device Screenshots**: High-res screenshots for iPhone, iPad, or Mac.
5. **Support & Contact Email**: E.g. `serhii.londar@gmail.com`.
6. **Third-Party Services**: Any analytics or SDKs used (e.g. Firebase, Crashlytics, TelemetryDeck).

---

### Step 2: Generate Core Files from Templates
Use the pre-built templates in the [resources](./resources/) directory as starting points:

1. **Main Landing Page** (`index.html`):
   - Reference template: [template-index.html](./resources/template-index.html)
   - Include OpenGraph, Twitter Card, and Apple Smart App Banner metadata.
   - Include ambient background glow orbs (`.ambient-glow`).
   - Sticky/glassmorphic navigation bar with app icon, name, badge, and CTA button.
   - Hero section with title, subtitle, stat counters, App Store download button, and interactive device mockup tab switcher.
   - 6-card Features Grid with distinct visual icons and hover states.
   - Screenshot Gallery Showcase with device frames.
   - Bottom CTA banner and comprehensive footer with disclaimer, nav links, and legal links.

2. **Stylesheet** (`index.css`):
   - Reference template: [template-index.css](./resources/template-index.css)
   - Curated dark OLED color tokens (`--bg-color: #08090d`, `--bg-surface: #10121a`).
   - Typography: Plus Jakarta Sans / Inter / JetBrains Mono via Google Fonts.
   - Responsive breakpoints (Desktop, Tablet, Mobile).

3. **Support & Help Center** (`support.html`):
   - Reference template: [template-support.html](./resources/template-support.html)
   - 3 contact channels: Direct Email, Bug Report, Feature Suggestion.
   - Expandable FAQ accordion (`<details class="faq-item">`).
   - App Metadata Box (Version, Supported OS versions, Support Contact, Developer name).

4. **Legal Pages** (`privacy-policy.html`, `privacy-policy.md`, `terms.html`, `terms.md`):
   - Reference templates: [template-privacy-policy.html](./resources/template-privacy-policy.html), [template-terms.html](./resources/template-terms.html), [template-privacy-policy.md](./resources/template-privacy-policy.md), [template-terms.md](./resources/template-terms.md)
   - Clear disclosure of data collection (or zero data collection if offline-first).
   - Clear contact information and effective dates.

---

### Step 3: Register New App in Root Hub (`index.html`)
After creating the app folder, register the new app card inside the central hub `/index.html`:

```html
<!-- App Card inside .apps-grid in root index.html -->
<article class="app-card app-card-<app-name>">
  <div class="app-preview-wrap">
    <img src="<app-folder>/assets/screenshots/screenshot-1.png" alt="<App Name> preview" loading="lazy">
    <div class="app-preview-overlay"></div>
    <div class="app-icon-badge">
      <img src="<app-folder>/assets/app_icon.png" alt="<App Name> Icon">
    </div>
  </div>

  <div class="app-card-body">
    <div class="app-header">
      <div class="app-title-group">
        <h3><App Name></h3>
        <span class="app-tagline"><Category / Subtitle></span>
      </div>
      <span class="app-badge-status status-live">Live</span>
    </div>

    <p class="app-description">
      <App short description>
    </p>

    <div class="app-tags">
      <span class="tag-pill">✨ Feature 1</span>
      <span class="tag-pill">📱 iOS &amp; iPadOS</span>
      <span class="tag-pill">⚡ Native Swift</span>
    </div>

    <div class="app-card-actions">
      <a href="<app-folder>/index.html" class="btn btn-primary">
        View Landing Page
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
      <a href="<app-folder>/support.html" class="btn btn-secondary" title="Support & Help">
        Support
      </a>
      <a href="<app-folder>/privacy-policy.html" class="btn btn-secondary" title="Privacy Policy">
        Privacy
      </a>
    </div>
  </div>
</article>
```

Also add a link to the new app in the root footer links.

---

## Quality & Compliance Checklist

- [ ] **App Store Compliance**: Both `privacy-policy.html` and `support.html` are accessible and contain working support email links.
- [ ] **SEO & Social Sharing**: Complete `<title>`, `<meta name="description">`, OpenGraph (`og:image`, `og:title`), and Twitter card tags.
- [ ] **Mobile Responsiveness**: Verified on mobile (375px–430px), tablet (768px–1024px), and desktop (1200px+).
- [ ] **Navigation Consistency**: Every subpage has navigation back to `index.html` and cross-links to `support.html`, `privacy-policy.html`, and `terms.html`.
- [ ] **Asset Optimization**: High-resolution screenshots with `loading="lazy"` on non-hero images.
- [ ] **No Dead Links**: All internal and external anchor tags point to valid destinations.
