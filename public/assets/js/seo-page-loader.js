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

    const providerMatch = path.match(/^\/provider\/([^/]+)$/);
    if (providerMatch) {
      const provider = decodeURIComponent(providerMatch[1]);
      console.log(`[SeoPageLoader] Matched provider: ${provider}`);
      this.loadProviderPage(provider);
      return;
    }

    const domainMatch = path.match(/^\/domain\/([^/]+)$/);
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
      const url = `${this.apiBaseUrl}/page/provider/${encodeURIComponent(provider)}`;
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
      const url = `${this.apiBaseUrl}/page/domain/${encodeURIComponent(domain)}`;
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
    const startTime = performance.now();
    console.log(`[SeoPageLoader] ===== DISPLAY PAGE START =====`);
    console.log(`[SeoPageLoader] HTML size: ${html.length} bytes`);
    console.log(`[SeoPageLoader] Page title from backend:`, html.match(/<title>([^<]*)<\/title>/)?.[1] || 'N/A');

    // Check if spinner exists before replacement
    const spinnerBefore = document.getElementById('spinner-body');
    console.log(`[SeoPageLoader] Spinner exists BEFORE document.write:`, spinnerBefore ? 'YES' : 'NO');
    if (spinnerBefore) {
      console.log(`[SeoPageLoader] Spinner visibility BEFORE:`, window.getComputedStyle(spinnerBefore).visibility);
    }

    // Clear global variables that might conflict with backend scripts
    console.log(`[SeoPageLoader] Clearing potentially conflicting globals...`);
    delete window.FAQ_DATA;
    delete window.userPlanPromise;

    console.log(`[SeoPageLoader] Calling document.open/write/close...`);
    const writeStartTime = performance.now();
    document.open();
    document.write(html);
    document.close();
    console.log(`[SeoPageLoader] document.write completed in ${performance.now() - writeStartTime}ms`);

    // Check if spinner exists after replacement
    const spinnerAfter = document.getElementById('spinner-body');
    console.log(`[SeoPageLoader] Spinner exists AFTER document.write:`, spinnerAfter ? 'YES' : 'NO');
    if (spinnerAfter) {
      console.log(`[SeoPageLoader] Spinner visibility AFTER:`, window.getComputedStyle(spinnerAfter).visibility);
      console.log(`[SeoPageLoader] Spinner has spinner-hidden class AFTER:`, spinnerAfter.classList.contains('spinner-hidden'));
    }

    console.log(`[SeoPageLoader] New document title:`, document.title);
    console.log(`[SeoPageLoader] Waiting for window.load event...`);

    // Wait for load event (all resources loaded) + CSS rendering
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      console.log(`[SeoPageLoader] ===== LOAD EVENT FIRED =====`);
      console.log(`[SeoPageLoader] Time since displayPage called: ${loadTime}ms`);

      // Check spinner before requestAnimationFrame
      const spinnerOnLoad = document.getElementById('spinner-body');
      console.log(`[SeoPageLoader] Spinner exists on load event:`, spinnerOnLoad ? 'YES' : 'NO');
      if (spinnerOnLoad) {
        console.log(`[SeoPageLoader] Spinner visibility on load:`, window.getComputedStyle(spinnerOnLoad).visibility);
        console.log(`[SeoPageLoader] Spinner classes on load:`, spinnerOnLoad.className);
      }

      // Ensure CSS is applied before hiding spinner (requestAnimationFrame waits for paint)
      console.log(`[SeoPageLoader] Calling requestAnimationFrame...`);
      requestAnimationFrame(() => {
        const rafTime = performance.now() - startTime;
        console.log(`[SeoPageLoader] ===== ANIMATION FRAME CALLBACK FIRED =====`);
        console.log(`[SeoPageLoader] Time since displayPage called: ${rafTime}ms`);

        // Hide the loading spinner
        const spinner = document.getElementById('spinner-body');
        console.log(`[SeoPageLoader] Spinner exists on RAF:`, spinner ? 'YES' : 'NO');

        if (spinner) {
          console.log(`[SeoPageLoader] Spinner visibility BEFORE hidden class:`, window.getComputedStyle(spinner).visibility);
          spinner.classList.add('spinner-hidden');
          console.log(`[SeoPageLoader] Added spinner-hidden class`);
          console.log(`[SeoPageLoader] Spinner visibility AFTER hidden class:`, window.getComputedStyle(spinner).visibility);
          console.log(`[SeoPageLoader] Spinner opacity AFTER hidden class:`, window.getComputedStyle(spinner).opacity);
          console.log(`[SeoPageLoader] Spinner classes AFTER hidden:`, spinner.className);
        } else {
          console.error(`[SeoPageLoader] ERROR: Spinner not found during RAF callback!`);
        }

        const event = new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
        console.log(`[SeoPageLoader] DOMContentLoaded event dispatched`);

        const totalTime = performance.now() - startTime;
        console.log(`[SeoPageLoader] ===== PAGE READY =====`);
        console.log(`[SeoPageLoader] Total time: ${totalTime}ms`);
      });
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
