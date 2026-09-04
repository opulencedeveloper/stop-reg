class SeoPageLoader {
  constructor() {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.apiBaseUrl = isDev
      ? "http://localhost:8080/api/v1/seo"
      : "https://api.stopreg.com/api/v1/seo";
    this.init();
  }

  init() {
    console.log(`[SeoPageLoader] init() called`);
    this.handleNavigation();
    window.addEventListener("popstate", () => this.handleNavigation());
  }

  handleNavigation() {
    const path = window.location.pathname;
    console.log(`[SeoPageLoader] handleNavigation() - path: ${path}`);

    const providerMatch = path.match(/^\/providers\/([^/]+)$/);
    if (providerMatch) {
      const provider = decodeURIComponent(providerMatch[1]);
      console.log(`[SeoPageLoader] Matched provider: ${provider}`);
      this.loadProviderPage(provider);
      return;
    }

    const domainMatch = path.match(/^\/domains\/([^/]+)$/);
    if (domainMatch) {
      const domain = decodeURIComponent(domainMatch[1]);
      console.log(`[SeoPageLoader] Matched domain: ${domain}`);
      this.loadDomainPage(domain);
      return;
    }

    console.log(`[SeoPageLoader] No SEO page pattern matched`);
  }

  async loadProviderPage(provider) {
    try {
      console.log(`[SeoPageLoader] loadProviderPage() called for: ${provider}`);
      const url = `http://localhost:8080/api/v1/seo/page/provider/${encodeURIComponent(provider)}`;
      console.log(`[SeoPageLoader] Fetching: ${url}`);

      const response = await fetch(url);
      console.log(`[SeoPageLoader] Response received: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      console.log(`[SeoPageLoader] HTML received: ${html.length} bytes`);
      this.displayPage(html);
    } catch (error) {
      console.error(`[SeoPageLoader] Error:`, error);
      this.showError(`Failed to load provider page: ${error.message}`);
    }
  }

  async loadDomainPage(domain) {
    try {
      const url = `http://localhost:8080/api/v1/seo/page/domain/${encodeURIComponent(domain)}`;
      console.log(`[SeoPageLoader] Fetching: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      this.displayPage(html);
    } catch (error) {
      console.error(`[SeoPageLoader] Error:`, error);
      this.showError(`Failed to load domain page: ${error.message}`);
    }
  }

  displayPage(html) {
    console.log(`[SeoPageLoader] Displaying full HTML page (${html.length} bytes)`);
    console.log(`[SeoPageLoader] Page title from backend:`, html.match(/<title>([^<]*)<\/title>/)?.[1] || 'N/A');

    // Clear global variables that might conflict with backend scripts
    console.log(`[SeoPageLoader] Clearing potentially conflicting globals...`);
    delete window.FAQ_DATA;
    delete window.userPlanPromise;

    console.log(`[SeoPageLoader] Calling document.open/write/close`);
    document.open();
    document.write(html);
    document.close();

    console.log(`[SeoPageLoader] Document replaced successfully`);
    console.log(`[SeoPageLoader] New document title:`, document.title);

    // Wait for all deferred scripts to execute, then trigger initialization
    console.log(`[SeoPageLoader] Waiting for deferred scripts to load...`);

    // Use load event which fires after all deferred scripts execute
    window.addEventListener('load', () => {
      console.log(`[SeoPageLoader] Load event fired - dispatching DOMContentLoaded for missed listeners...`);
      const event = new Event('DOMContentLoaded', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      console.log(`[SeoPageLoader] DOMContentLoaded event dispatched`);
      console.log(`[SeoPageLoader] Page ready`);
    }, { once: true });
  }

  showError(message) {
    document.open();
    document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; }
          .error-container {
            max-width: 600px;
            margin: 40px auto;
            padding: 40px 20px;
            text-align: center;
            background: #fee;
            border-radius: 8px;
            border: 1px solid #fcc;
          }
          h2 { color: #c33; margin-bottom: 10px; }
          p { color: #666; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #1452CA;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h2>Error</h2>
          <p>${message}</p>
          <a href="/">Go Home</a>
        </div>
      </body>
      </html>
    `);
    document.close();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new SeoPageLoader();
  });
} else {
  new SeoPageLoader();
}
