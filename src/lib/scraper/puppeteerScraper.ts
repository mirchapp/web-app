import puppeteer, { Page, Browser } from 'puppeteer';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Cache for content classification to avoid repeated API calls
const classificationCache = new Map<string, { score: number; confidence: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Count prices in text - handles both currency symbols and standalone numbers
 */
const countPrices = (text: string): number => {
  // Match currency symbols followed by numbers: $11.99, €15, £9.50
  const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;

  // Match standalone price-like numbers: 11.99, 15.00, 9.50
  // Must have exactly 2 decimal places to avoid false positives (years, counts, etc.)
  const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;

  return withCurrency + withoutCurrency;
};

/**
 * Classify content as menu vs non-menu using GPT-4 mini
 * Returns score 0-100 (higher = better menu content) and confidence 0-1
 */
async function classifyContentWithGPT(content: string): Promise<{ score: number; confidence: number; isMenu: boolean }> {
  try {
    // Create cache key from content hash
    const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content.slice(0, 1000)));
    const cacheKey = Array.from(new Uint8Array(contentHash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

    // Check cache first
    const cached = classificationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[GPT Cache] Using cached classification: score ${cached.score}, confidence ${cached.confidence}`);
      return {
        score: cached.score,
        confidence: cached.confidence,
        isMenu: cached.score > 50
      };
    }

    // Truncate content for API efficiency (first 2000 chars usually enough)
    const truncatedContent = content.slice(0, 2000);
    const wordCount = truncatedContent.split(/\s+/).length;

    if (wordCount < 50) {
      console.log('[GPT Classification] Content too short, using fallback scoring');
      const fallbackScore = scoreMenuContent(content);
      return { score: fallbackScore, confidence: 0.5, isMenu: fallbackScore > 50 };
    }

    console.log(`[GPT Classification] Analyzing ${wordCount} words...`);

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      reasoning: { effort: "low" },
      instructions: "You are a restaurant menu expert. Analyze if content contains a restaurant menu and rate its quality. Be decisive and fast.",
      input: `Analyze this web page content and determine if it contains a restaurant menu:

CONTENT:
${truncatedContent}

RATE on a scale of 0-100 how likely this is restaurant menu content:
- 80-100: Clear, comprehensive restaurant menu with items, prices, descriptions
- 60-79: Good menu content, may be partial or have some non-menu elements
- 40-59: Some menu-like elements but unclear or mixed with other content
- 20-39: Minimal menu content, mostly other restaurant information
- 0-19: Not menu content, or completely unrelated

Consider:
- Food items with prices
- Menu categories (appetizers, entrees, etc.)
- Restaurant context vs general website content
- Quality and completeness of menu information

Return your confidence in this rating (0.0-1.0).`,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "menu_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Quality score of menu content (0-100)"
              },
              confidence: {
                type: "number",
                minimum: 0.0,
                maximum: 1.0,
                description: "Confidence in the rating (0.0-1.0)"
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of the rating"
              }
            },
            required: ["score", "confidence", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const result = JSON.parse(response.output_text);
    const classification = {
      score: result.score,
      confidence: result.confidence,
      isMenu: result.score > 50
    };

    // Cache the result
    classificationCache.set(cacheKey, {
      score: classification.score,
      confidence: classification.confidence,
      timestamp: Date.now()
    });

    console.log(`[GPT Classification] Score: ${classification.score}/100, Confidence: ${classification.confidence}, Menu: ${classification.isMenu}`);
    console.log(`[GPT Reasoning] ${result.reasoning}`);

    return classification;
  } catch (error) {
    console.warn('[GPT Classification] Failed, falling back to heuristic scoring:', error);
    // Fallback to heuristic scoring if GPT fails
    const fallbackScore = scoreMenuContent(content);
    return { score: fallbackScore, confidence: 0.3, isMenu: fallbackScore > 50 };
  }
}

/**
 * Score menu content quality - returns 0-100 score
 * Higher scores indicate better menu content
 */
const scoreMenuContent = (text: string): number => {
  let score = 0;
  const lowerText = text.toLowerCase();

  // Price scoring (but more nuanced)
  const priceCount = countPrices(text);
  const priceDensity = priceCount / Math.max(text.length / 1000, 1); // prices per 1000 chars

  // Good: 5-20 prices per 1000 chars suggests menu content
  if (priceDensity >= 5 && priceDensity <= 20) score += 40;
  else if (priceDensity > 20) score += 20; // Too many might be non-menu
  else if (priceDensity >= 2) score += 15; // Some prices, might be menu

  // Menu keywords (weighted by specificity)
  const foodKeywords = [
    'appetizer', 'entree', 'entrée', 'main course', 'side dish', 'dessert',
    'beverage', 'drink', 'wine', 'beer', 'cocktail', 'coffee', 'tea',
    'sandwich', 'burger', 'pizza', 'salad', 'soup', 'pasta', 'rice', 'noodles',
    'chicken', 'beef', 'fish', 'seafood', 'vegetarian', 'vegan', 'gluten-free'
  ];
  const specificKeywords = ['menu', 'lunch', 'dinner', 'breakfast', 'daily specials'];

  let keywordScore = 0;
  foodKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) keywordScore += 2;
  });
  specificKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) keywordScore += 5;
  });

  score += Math.min(keywordScore, 30); // Cap at 30 points

  // Structure indicators
  const hasCategories = /\b(appetizers|entrees|desserts|beverages|mains|sides)\b/i.test(text);
  const hasItemLists = (text.match(/\$\d+\.?\d*/g) || []).length > 3;
  const hasDescriptions = text.split('\n').filter(line =>
    line.length > 20 && line.length < 200 && /\$\d+\.?\d*/.test(line)
  ).length;

  if (hasCategories) score += 15;
  if (hasItemLists) score += 10;
  if (hasDescriptions) score += 10;

  // Penalties for non-menu content
  const nonMenuIndicators = ['privacy policy', 'terms of service', 'contact us', 'directions', 'about us'];
  nonMenuIndicators.forEach(indicator => {
    if (lowerText.includes(indicator)) score -= 5;
  });

  // Length bonus (but not too long - might be entire site)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 200 && wordCount < 2000) score += 10;
  else if (wordCount > 2000) score -= 10; // Too much content, probably not focused menu

  return Math.max(0, Math.min(100, score));
};

interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  background?: string;
}

interface WebsiteData {
  text: string;
  logo?: string;
  colors?: ColorPalette;
}

interface ScraperOptions {
  headless?: boolean;
  timeout?: number;
  minContentLength?: number;
  maxRetries?: number;
  userAgent?: string;
}

/**
 * Production-grade restaurant menu scraper - OPTIMIZED FOR SPEED
 * Handles: dropdowns, multi-location menus, lazy loading, popups, tabs, SPAs, iframes
 * Target: Complete scrape in under 30 seconds for 95% of sites
 */
export async function scrapeRestaurantMenuWithPuppeteer(
  url: string,
  options: ScraperOptions = {}
): Promise<WebsiteData | null> {
  const {
    headless = false,
    timeout = 20000,
    minContentLength = 200,
    maxRetries = 2,
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  } = options;

  let lastError: Error | null = null;

  // Retry logic for transient failures
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let browser: Browser | null = null;

    try {
      if (attempt > 0) {
        console.log(`[Scraper] Retry attempt ${attempt + 1}/${maxRetries}`);
        await delay(1000 * attempt);
      }

      browser = await puppeteer.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--window-size=1920,1080',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(timeout);
      page.setDefaultTimeout(timeout - 5000);

      // Stealth techniques
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      });

      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      console.log(`[Scraper] Navigating to: ${url}`);

      // Navigate with fallback
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout });
      } catch (_navError) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeout / 2 });
      }

      // Detect if it's a SPA (React, Vue, etc.)
      const isSPA = await page.evaluate(() => {
        return !!(document.querySelector('#root, #app, [id*="react"], [id*="vue"]'));
      });

      if (isSPA) {
        console.log('[Scraper] SPA detected, waiting for content to render...');

        // Smart SPA waiting: monitor content quality using GPT
        const initialContent = await page.evaluate(() => document.body.innerText || '');
        const initialClassification = await classifyContentWithGPT(initialContent);

        if (initialClassification.score < 40 || initialClassification.confidence < 0.6) {
          // Wait for content to improve or stabilize
          console.log('[Scraper] SPA content poor, waiting for better content...');
          await page.waitForFunction(() => {
            const text = document.body.innerText || '';
            const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
            const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;
            const priceCount = withCurrency + withoutCurrency;
            return text.length > 500 || priceCount > 5;
          }, { timeout: 6000 });
          console.log('[Scraper] SPA content loaded');
        } else {
          console.log(`[Scraper] SPA already has good content (score: ${initialClassification.score}), proceeding quickly`);
          await delay(300); // Very brief wait for any final renders
        }
      } else {
        // Quick content check for static sites
        try {
          await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 2000 });
        } catch {
          console.log('[Scraper] Content loaded quickly or minimal content');
        }
      }

      // Execute scraping pipeline
      await dismissPopups(page);

      // Extract logo and colors from ORIGINAL page before navigating
      console.log('[Scraper] Extracting logo and colors from original page');

      const [logo, colors] = await Promise.all([
        extractLogo(page),
        extractColorPalette(page)
      ]);

      console.log('[Scraper] Logo:', logo || 'None');
      console.log('[Scraper] Colors extracted:', JSON.stringify(colors, null, 2));

      // Now navigate to menu (might go to ordering platform)
      await navigateToMenu(page);
      await dismissPopups(page);
      await handleLocationBasedMenus(page);
      await expandSections(page);

      // Click through categories and collect all text
      const allContent = await clickThroughCategoriesAndExtract(page);

      console.log('[Scraper] Extracted', allContent.length, 'characters');
      console.log('[Scraper] Final logo:', logo ? 'Yes' : 'No', '| Colors:', Object.keys(colors).length);

      await browser.close();

      // Validate content quality using GPT
      const contentClassification = await classifyContentWithGPT(allContent);
      const meetsMinLength = allContent.length >= minContentLength;

      console.log(`[Final Validation] Length: ${allContent.length}, Score: ${contentClassification.score}/100, Confidence: ${contentClassification.confidence}`);

      // Accept if content is good quality with decent confidence, OR meets minimum length with reasonable quality
      const isAcceptable = (contentClassification.score > 60 && contentClassification.confidence > 0.6) ||
                          (meetsMinLength && contentClassification.score > 40 && contentClassification.confidence > 0.5);

      if (!isAcceptable) {
        console.warn(`[Scraper] Content quality too low (score: ${contentClassification.score}, confidence: ${contentClassification.confidence}), rejecting`);
        if (attempt === maxRetries - 1) {
          return null;
        }
        continue;
      }

      return {
        text: allContent,
        logo: logo || undefined,
        colors: Object.keys(colors).length > 0 ? colors : undefined,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Scraper] Attempt ${attempt + 1} failed:`, lastError.message);

      if (browser) {
        try {
          await browser.close();
        } catch (_closeError) {
          // Ignore
        }
      }

      if (attempt < maxRetries - 1) {
        continue;
      }
    }
  }

  console.error('[Scraper] All retries failed:', lastError?.message);
  return null;
}

/**
 * Dismiss popups - OPTIMIZED
 */
async function dismissPopups(page: Page): Promise<void> {
  try {
    const result = await page.evaluate(() => {
      // First priority: Look for X/close buttons in modals
      const modals = Array.from(document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="popup"], [id*="modal"], [id*="popup"]'));

      for (const modal of modals) {
        // Look for close button with common patterns
        const closeButtons = Array.from(modal.querySelectorAll('button, a, [role="button"], [aria-label*="close"], [aria-label*="dismiss"]')) as HTMLElement[];

        for (const btn of closeButtons) {
          const text = (btn.textContent || '').toLowerCase().trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          const className = (btn.className || '').toString().toLowerCase();
          const rect = (btn as HTMLElement).getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) continue;

          // Check for X button patterns
          const isCloseButton =
            text === '×' || text === 'x' || text === '✕' ||
            ariaLabel.includes('close') || ariaLabel.includes('dismiss') ||
            className.includes('close') || className.includes('dismiss') ||
            (btn as HTMLElement).innerHTML.includes('×') ||
            (btn as HTMLElement).innerHTML.includes('✕');

          if (isCloseButton) {
            console.log('[Popup] Clicking close button:', text || ariaLabel || 'X icon');
            (btn as HTMLElement).click();
            return { clicked: true, text: text || 'X', inModal: true, type: 'close' };
          }
        }
      }

      // Second priority: General accept/dismiss keywords
      const acceptKeywords = ['accept', 'allow', 'agree', 'continue', 'got it', 'close', 'dismiss', 'no thanks', '×', 'x'];
      const exactKeywords = ['ok', 'yes', 'no']; // These must be exact word matches
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], [class*="modal"] button, [class*="popup"] button'));

      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase().trim();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const href = (btn as HTMLAnchorElement).href || '';
        const className = (btn.className || '').toString();

        if (rect.width === 0 || rect.height === 0 || text.length > 60) continue;

        const inModal = btn.closest('[role="dialog"], [class*="modal"], [class*="popup"]');

        // Skip navigation items - they should never be popup buttons
        const isNavItem = className.includes('nav') ||
                         className.includes('menu-item') ||
                         className.includes('elementor-item') ||
                         btn.closest('nav, header');

        if (isNavItem) continue;

        // Check if it's an accept button with proper word boundary matching
        const hasKeyword = acceptKeywords.some(kw => text.includes(kw) || ariaLabel.includes(kw));
        const hasExactKeyword = exactKeywords.some(kw => {
          // Match as whole word only (with word boundaries)
          const regex = new RegExp(`\\b${kw}\\b`);
          return regex.test(text) || regex.test(ariaLabel);
        });
        const isAcceptButton = hasKeyword || hasExactKeyword;

        if (isAcceptButton && inModal) {
          console.log('[Popup] Clicking accept button:', text);
          (btn as HTMLElement).click();
          return { clicked: true, text, className, href, inModal: true, type: 'accept' };
        }
      }

      // Fallback: Remove blocking overlays
      const overlays = Array.from(document.querySelectorAll('[class*="overlay"], [class*="backdrop"]'));
      for (const overlay of overlays) {
        const style = window.getComputedStyle(overlay as HTMLElement);
        if (style.position === 'fixed' && parseInt(style.zIndex) > 100) {
          const rect = (overlay as HTMLElement).getBoundingClientRect();
          if (rect.width > window.innerWidth * 0.8) {
            (overlay as HTMLElement).remove();
            return { clicked: false, removed: true, className: (overlay as HTMLElement).className };
          }
        }
      }

      return { clicked: false };
    });

    if (result && result.clicked) {
      await delay(200);
    }
  } catch (_error) {
    // Ignore popup errors
  }
}

/**
 * Navigate to menu page - OPTIMIZED
 */
async function navigateToMenu(page: Page): Promise<void> {
  try {
    // First, evaluate current page quality using GPT
    const currentContent = await page.evaluate(() => document.body.innerText || '');
    const currentClassification = await classifyContentWithGPT(currentContent);

    console.log(`[Menu Quality] Current page: score ${currentClassification.score}/100, confidence ${currentClassification.confidence}`);

    // Only stay on current page if it has truly excellent menu content (>80) with high confidence (>0.8)
    // This prevents navigation away from complete menus, but allows navigation to better menu pages
    if (currentClassification.score > 80 && currentClassification.confidence > 0.8) {
      console.log('[Scraper] Current page has excellent menu content, staying here');
      return;
    }

    // Check if there are clear menu navigation options available
    const hasMenuNavigation = await page.evaluate(() => {
      // Look for menu-related links and buttons
      const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      const menuKeywords = ['menu', 'view menu', 'see menu', 'full menu', 'our menu', 'menu page'];

      for (const el of elements) {
        const text = (el.textContent || '').toLowerCase().trim();
        const href = (el as HTMLAnchorElement).href || '';

        // Check if text contains menu keywords
        if (menuKeywords.some(keyword => text.includes(keyword))) {
          const rect = (el as HTMLElement).getBoundingClientRect();
          // Check if element is visible and reasonably sized
          if (rect.width > 20 && rect.height > 10) {
            return true;
          }
        }

        // Also check href for menu paths
        if (href && href.toLowerCase().includes('/menu')) {
          const rect = (el as HTMLElement).getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return true;
          }
        }
      }

      return false;
    });

    // If decent content (>60) but there are menu navigation options, try to navigate
    if (currentClassification.score > 60 && currentClassification.confidence > 0.7 && !hasMenuNavigation) {
      console.log('[Scraper] Current page has good menu content and no menu navigation options, staying here');
      return;
    }

    const menuPageCheck = await page.evaluate((currentClassification) => {
      const url = window.location.href.toLowerCase();
      const text = document.body.innerText.toLowerCase();

      // Strong signal: URL explicitly has /menu/ or /menu? or ends with /menu
      const hasStrongMenuUrl = url.match(/\/menu[\/\?]/) || url.endsWith('/menu');

      // If URL strongly indicates menu page, trust it (even with lazy-loaded content)
      if (hasStrongMenuUrl) return { isMenuPage: true, shouldNavigate: false };

      // For weak menu URLs or no menu URL, check content quality
      const hasWeakMenuUrl = url.includes('/menu') || url.includes('/merchant/');

      const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
      const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;
      const priceCount = withCurrency + withoutCurrency;

      const menuKeywords = [
        'appetizer', 'entree', 'entrée', 'dessert', 'beverage', 'main course',
        'sandwich', 'burger', 'pizza', 'salad', 'soup', 'starter', 'side'
      ];
      const menuKeywordMatches = menuKeywords.filter(kw => text.includes(kw)).length;

      const hasMenuContent = (menuKeywordMatches >= 2 && priceCount >= 3) || priceCount > 8;
      const hasMenuGrid = !!document.querySelector('[id*="menu-grid"], [id*="menu-items"], [class*="menu-items"], [class*="menu-grid"], [class*="food-items"], [class*="menu-container"]');

      const signals = [hasWeakMenuUrl, hasMenuContent, hasMenuGrid].filter(Boolean).length;

      console.log('[Menu Detection]', {
        url: url,
        priceCount: priceCount,
        menuKeywordMatches: menuKeywordMatches,
        hasStrongMenuUrl: hasStrongMenuUrl,
        hasWeakMenuUrl: hasWeakMenuUrl,
        hasMenuContent: hasMenuContent,
        hasMenuGrid: hasMenuGrid,
        signals: signals,
        currentScore: currentClassification.score,
        confidence: currentClassification.confidence
      });

      // If current page has excellent menu content (>75) with high confidence (>0.8), don't navigate
      if (currentClassification.score > 75 && currentClassification.confidence > 0.8) {
        return { isMenuPage: true, shouldNavigate: false };
      }

      // If decent content but URL clearly indicates menu page, stay
      if (currentClassification.score > 50 && currentClassification.confidence > 0.7 && hasStrongMenuUrl) {
        return { isMenuPage: true, shouldNavigate: false };
      }

      // Otherwise, be more aggressive about navigation - even 1 signal is enough if we have menu navigation options
      const shouldNavigate = signals >= 1;
      return { isMenuPage: signals >= 1, shouldNavigate };
    }, currentClassification);

    if (menuPageCheck.isMenuPage && !menuPageCheck.shouldNavigate) {
      console.log('[Scraper] Already on acceptable menu page');
      return;
    }

    // Try dropdown first
    const dropdownClicked = await handleDropdownMenu(page);
    if (dropdownClicked) {
      await delay(600);
      return;
    }

    // Look for menu button
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));

      for (const btn of buttons) {
        const text = (btn.textContent || '').trim();
        const textLower = text.toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const href = (btn as HTMLAnchorElement).href || '';

        if (!text || text.length > 60 || rect.width === 0 || rect.height === 0) continue;
        if (textLower.includes('cart') || textLower.includes('checkout') || textLower.includes('account') || textLower.includes('login')) continue;

        if (textLower.includes('menu') || textLower === 'menu' || textLower.includes('view menu')) {
          return { buttonText: text, href: href };
        }
      }

      // Fallback to order button
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim();
        const textLower = text.toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();
        const href = (btn as HTMLAnchorElement).href || '';

        if (!text || text.length > 60 || rect.width === 0 || rect.height === 0) continue;

        if (textLower.includes('order now') || textLower.includes('order online') || textLower.includes('start order')) {
          return { buttonText: text, href: href };
        }
      }

      return { buttonText: null, href: '' };
    });

    if (!buttonInfo.buttonText) {
      console.log('[Scraper] No menu button found');
      return;
    }

    console.log('[Scraper] Found menu button:', buttonInfo.buttonText, '| href:', buttonInfo.href);

    // Check if menu button will cause navigation
    const willNavigate = buttonInfo.href && !buttonInfo.href.includes('#') && buttonInfo.href !== page.url();
    console.log('[Scraper] Will navigate?', willNavigate, '| Is anchor?', buttonInfo.href?.includes('#'));

    if (willNavigate) {
      // Check if link opens in new tab (target="_blank") - if so, just navigate directly
      const targetInfo = await page.evaluate((text) => {
        const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
        for (const btn of buttons) {
          if ((btn.textContent || '').trim() === text) {
            const target = btn.getAttribute('target');
            const href = (btn as HTMLAnchorElement).href || '';
            return { target, href };
          }
        }
        return { target: null, href: '' };
      }, buttonInfo.buttonText);

      if (targetInfo.target === '_blank' && targetInfo.href) {
        console.log('[Scraper] Button opens in new tab, navigating directly to:', targetInfo.href);
        // Instead of clicking and opening new tab, just navigate to the URL
        await page.goto(targetInfo.href, { waitUntil: 'networkidle2', timeout: 10000 });
      } else {
        // Normal navigation (same page)
        console.log('[Scraper] Clicking button for same-page navigation...');
        const [_response] = await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
          page.evaluate((text) => {
            const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
            for (const btn of buttons) {
              if ((btn.textContent || '').trim() === text) {
                const rect = (btn as HTMLElement).getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  (btn as HTMLElement).click();
                  return true;
                }
              }
            }
            return false;
          }, buttonInfo.buttonText)
        ]);
      }

      // After navigation, check if we landed on an ordering platform
      const currentUrl = page.url();
      console.log('[Scraper] Navigated to:', currentUrl);

      const isSPA = await page.evaluate(() => {
        return !!(document.querySelector('#root, #app, [id*="react"], [id*="vue"]'));
      });

      const currentUrlLower = currentUrl.toLowerCase();
      const looksLikeOrderingPlatform =
        isSPA ||
        currentUrlLower.includes('order.online') ||
        currentUrlLower.includes('doordash') ||
        currentUrlLower.includes('ubereats') ||
        currentUrlLower.includes('grubhub') ||
        currentUrlLower.includes('postmates') ||
        currentUrlLower.includes('skipthedishes') ||
        currentUrlLower.includes('chownow') ||
        currentUrlLower.includes('toasttab') ||
        currentUrlLower.includes('square.site') ||
        currentUrlLower.includes('clover') ||
        currentUrlLower.includes('bentobox');

      if (looksLikeOrderingPlatform) {
        console.log('[Scraper] Ordering platform detected, handling follow-up interactions...');
        await delay(1200);

        // Attempt to click location-level order buttons BEFORE waiting for menu content
        const platformHandled = await handleOrderingPlatform(page);
        if (platformHandled) {
          console.log('[Scraper] Ordering platform interaction handled, giving page time to load menu...');
          await delay(1500);
        }

        try {
          await page.waitForFunction(() => {
            const text = document.body.innerText || '';
            const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
            const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;
            const priceCount = withCurrency + withoutCurrency;
            const lowerText = text.toLowerCase();
            const hasMenuTerms = lowerText.includes('add to') || lowerText.includes('order') || lowerText.includes('menu') || lowerText.includes('checkout');
            return (text.length > 500 && hasMenuTerms) || priceCount > 5;
          }, { timeout: 10000 });
          console.log('[Scraper] Ordering platform menu loaded');
        } catch {
          console.warn('[Scraper] Ordering platform timeout, continuing...');
          await delay(2000);
        }
      } else {
        // Quick content check for static sites
        try {
          await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 2000 });
        } catch {
          console.log('[Scraper] Content loaded quickly or minimal content');
        }
      }
    } else {
      // Anchor link or non-navigation button
      console.log('[Scraper] Clicking anchor link:', buttonInfo.buttonText);
      const _clicked = await page.evaluate((text) => {
        const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
        for (const btn of buttons) {
          if ((btn.textContent || '').trim() === text) {
            const rect = (btn as HTMLElement).getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              (btn as HTMLElement).click();
              console.log('[Scraper] Clicked anchor button:', text);
              return true;
            }
          }
        }
        return false;
      }, buttonInfo.buttonText);

      // After anchor scroll, wait for section to appear and animations to complete
      console.log('[Scraper] Waiting for content to appear after anchor scroll...');
      await delay(1500);

      console.log('[Scraper] Searching for secondary menu button after anchor scroll...');

      const secondaryButton = await page.evaluate(() => {
        const shouldExclude = (el: Element, text: string, href: string): { excluded: boolean; reason?: string } => {
          // Check if in footer first
          if (el.closest('footer')) return { excluded: true, reason: 'in footer' };

          const textLower = text.toLowerCase();

          // Exclude Google Maps, social media, and utility links
          if (href.includes('google.com/maps')) return { excluded: true, reason: 'google maps' };
          if (href.includes('facebook.com')) return { excluded: true, reason: 'facebook' };
          if (href.includes('instagram.com')) return { excluded: true, reason: 'instagram' };
          if (href.includes('twitter.com')) return { excluded: true, reason: 'twitter' };
          if (href.includes('linkedin.com')) return { excluded: true, reason: 'linkedin' };
          if (href.includes('tiktok.com')) return { excluded: true, reason: 'tiktok' };
          if (textLower.includes('directions')) return { excluded: true, reason: 'directions text' };
          if (textLower.includes('privacy')) return { excluded: true, reason: 'privacy text' };
          if (textLower.includes('terms')) return { excluded: true, reason: 'terms text' };

          // DON'T exclude if it's menu/order related
          if (textLower.includes('menu') || textLower.includes('order')) {
            return { excluded: false };
          }

          if (textLower.includes('contact')) return { excluded: true, reason: 'contact text' };
          if (textLower.includes('about')) return { excluded: true, reason: 'about text' };
          if (textLower.includes('location')) return { excluded: true, reason: 'location text' };

          return { excluded: false };
        };

        // Broader selector to include Elementor buttons
        const buttons = Array.from(document.querySelectorAll('a, button, [role="button"], .elementor-button, [class*="button"]'));
        console.log('[Secondary Button Search] Found', buttons.length, 'button elements');

        let candidateCount = 0;
        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          const textLower = text.toLowerCase();
          const href = (btn as HTMLAnchorElement).href || '';
          const rect = (btn as HTMLElement).getBoundingClientRect();
          const classes = (btn as HTMLElement).className || '';

          // Check exclusion
          const exclusionResult = shouldExclude(btn, text, href);

          // Look for menu-related buttons
          const isMenuButton = textLower.includes('view menu') || textLower.includes('see menu') ||
                              textLower.includes('order now') || textLower.includes('order online') ||
                              textLower === 'order' || textLower === 'menu';

          if (isMenuButton) {
            candidateCount++;
            console.log(`[Secondary Button Search] Candidate ${candidateCount}:`, {
              text: text,
              href: href,
              visible: rect.width > 0 && rect.height > 0,
              excluded: exclusionResult.excluded,
              reason: exclusionResult.reason,
              classes: classes,
              hasHref: !!href,
              isAnchor: href.includes('#')
            });

            if (exclusionResult.excluded) {
              console.log(`  -> Excluded: ${exclusionResult.reason}`);
              continue;
            }

            if (rect.width === 0 || rect.height === 0) {
              console.log('  -> Skipped: not visible');
              continue;
            }

            // Make sure it has an href
            if (href) {
              // Allow if it's a full URL (even with hash for SPAs) or a relative non-anchor URL
              const isFullUrl = href.startsWith('http://') || href.startsWith('https://');
              const isAnchorOnly = href.startsWith('#');

              if (isFullUrl || (!isAnchorOnly && !href.startsWith('#'))) {
                console.log('  -> ✅ SELECTED as secondary button');
                return { text: text, href: href };
              } else {
                console.log('  -> Skipped: anchor-only link');
              }
            } else {
              console.log('  -> Skipped: no href');
            }
          }
        }

        console.log('[Secondary Button Search] No suitable button found after checking', candidateCount, 'candidates');
        return null;
      });

      if (secondaryButton) {
        console.log('[Scraper] Found secondary menu button after scroll:', secondaryButton.text);

        // Check if it opens in new tab
        const targetInfo = await page.evaluate((text) => {
          const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
          for (const btn of buttons) {
            if ((btn.textContent || '').trim() === text) {
              const target = btn.getAttribute('target');
              const href = (btn as HTMLAnchorElement).href || '';
              return { target, href };
            }
          }
          return { target: null, href: '' };
        }, secondaryButton.text);

        if (targetInfo.target === '_blank' && targetInfo.href) {
          console.log('[Scraper] Secondary button opens in new tab, navigating directly...');
          await page.goto(targetInfo.href, { waitUntil: 'networkidle2', timeout: 10000 });

          // Check if SPA and wait for content
          const isSPA = await page.evaluate(() => {
            return !!(document.querySelector('#root, #app, [id*="react"], [id*="vue"]'));
          });

          if (isSPA) {
            console.log('[Scraper] Secondary navigation led to SPA, waiting for content...');
            await delay(2000);
            try {
              await page.waitForFunction(() => {
                const text = document.body.innerText || '';
                const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
                const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;
                const priceCount = withCurrency + withoutCurrency;
                return text.length > 500 || priceCount > 5;
              }, { timeout: 10000 });
            } catch {
              await delay(2000);
            }
          }
        } else {
          // Regular navigation
          console.log('[Scraper] Clicking secondary menu button...');
          const [_response] = await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => null),
            page.evaluate((text) => {
              const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
              for (const btn of buttons) {
                if ((btn.textContent || '').trim() === text) {
                  (btn as HTMLElement).click();
                  return true;
                }
              }
              return false;
            }, secondaryButton.text)
          ]);
        }
      }
    }

    await delay(1000);

    try {
      await page.waitForSelector('[id*="menu"], [class*="menu-grid"], main', { timeout: 3000 });
    } catch {
      // Continue anyway
    }
  } catch (_error) {
    // Ignore navigation errors
  }
}

/**
 * Handle dropdown menu - OPTIMIZED
 */
async function handleDropdownMenu(page: Page): Promise<boolean> {
  try {
    const result = await page.evaluate(async () => {
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"], [aria-haspopup="menu"], .w-dropdown'));

      for (const dropdown of dropdowns) {
        const text = (dropdown.textContent || '').toLowerCase();
        if (!text.includes('menu')) continue;

        const toggle = dropdown.querySelector('[class*="toggle"], button, .w-dropdown-toggle');
        const toggleEl = (toggle || dropdown) as HTMLElement;
        toggleEl.click();

        await new Promise(r => setTimeout(r, 300));

        let list = null;
        const controlsId = toggleEl.getAttribute('aria-controls');
        if (controlsId) {
          list = document.getElementById(controlsId);
        }
        if (!list) {
          list = dropdown.querySelector('[class*="dropdown-list"], .w-dropdown-list');
        }

        if (list) {
          const links = Array.from(list.querySelectorAll('a')) as HTMLAnchorElement[];
          for (const link of links) {
            const href = link.getAttribute('href') || '';
            const linkText = (link.textContent || '').toLowerCase().trim();

            if (href.includes('/menu') || linkText === 'regular' || linkText === 'menu') {
              (link as HTMLElement).click();
              return true;
            }
          }
        }
      }

      return false;
    });

    if (result) {
      await delay(500);
    }
    return result;
  } catch (_error) {
    return false;
  }
}

/**
 * Handle multi-location menus - OPTIMIZED
 */
async function handleLocationBasedMenus(page: Page): Promise<void> {
  try {
    const target = await page.evaluate(() => {
      const url = window.location.href.toLowerCase();
      if (!url.includes('/menu')) return null;

      const text = document.body.innerText.toLowerCase();
      const withCurrency = (text.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
      const withoutCurrency = (text.match(/\b\d+\.\d{2}\b/g) || []).length;
      const priceCount = withCurrency + withoutCurrency;
      if (priceCount >= 15) return null;

      const clickable = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const candidates: Array<{ text: string; score: number }> = [];

      for (const el of clickable) {
        const text = (el.textContent || '').trim();
        const textLower = text.toLowerCase();
        const href = el.getAttribute('href') || '';
        const rect = (el as HTMLElement).getBoundingClientRect();

        if (rect.width < 80 || rect.height < 30 || text.length > 50) continue;

        let score = 0;
        if (textLower.includes('menu') && text.length < 40) score += 100;
        if (/\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd)/i.test(text)) score += 90;
        if (/store\s*#?\d+/i.test(textLower)) score += 85;
        if (href.includes('/menu/')) score += 70;

        if (score > 0) candidates.push({ text, score });
      }

      candidates.sort((a, b) => b.score - a.score);
      return candidates.length >= 2 && candidates[0].score >= 60 ? candidates[0].text : null;
    });

    if (!target) return;

    await page.evaluate((text) => {
      const clickable = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      for (const el of clickable) {
        if ((el.textContent || '').trim() === text) {
          const rect = (el as HTMLElement).getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            (el as HTMLElement).click();
            return;
          }
        }
      }
    }, target);

    await delay(500);
  } catch (_error) {
    // Ignore
  }
}

/**
 * Expand accordion sections - OPTIMIZED (faster, less iterations)
 */
async function expandSections(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      let count = 0;
      const maxExpand = 50;

      // Helper to check if element is likely menu-related
      const isMenuRelated = (el: Element): boolean => {
        const text = (el.textContent || '').toLowerCase();
        const classes = (el.className || '').toString().toLowerCase();
        const id = (el.id || '').toLowerCase();

        // Skip if in header/nav/footer (likely navigation, not menu content)
        if (el.closest('nav, header, footer')) return false;

        // Skip if clearly navigation
        const navIndicators = ['dropdown', 'nav-', 'navbar', 'navigation', 'menu-item', 'hamburger'];
        if (navIndicators.some(ind => classes.includes(ind) || id.includes(ind))) return false;

        // Include if in main content area AND contains menu-like keywords
        const inMainContent = el.closest('main, [role="main"], article, section[class*="menu"], section[class*="content"]');
        const menuKeywords = ['appetizer', 'entree', 'entrée', 'dessert', 'sandwich', 'burger', 'pizza', 'salad', 'menu', 'category'];
        const hasMenuKeywords = menuKeywords.some(kw => text.includes(kw));

        return !!inMainContent && hasMenuKeywords;
      };

      // Expand aria-expanded=false (but only menu-related ones)
      const expandables = Array.from(document.querySelectorAll('[aria-expanded="false"]'));
      for (const el of expandables) {
        if (count >= maxExpand) break;
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && isMenuRelated(el)) {
          try {
            (el as HTMLElement).click();
            count++;
            await new Promise(r => setTimeout(r, 10));
          } catch {}
        }
      }

      // Open details elements (these are safer - less likely to navigate)
      const details = Array.from(document.querySelectorAll('details:not([open])')) as HTMLDetailsElement[];
      for (const d of details) {
        if (count >= maxExpand) break;
        try {
          d.open = true;
          count++;
        } catch {}
      }
    });

    await delay(150);
  } catch (_error) {
    // Ignore
  }
}

/**
 * Click through categories and extract - HEAVILY OPTIMIZED
 */
async function clickThroughCategoriesAndExtract(page: Page): Promise<string> {
  try {
    let allText = '';
    const seenContent = new Set<string>();

    // Wait for any animated content to appear (Elementor, tab systems, etc.)
    await delay(1000);

    // STRATEGY 0: Try to extract all tab content directly (faster, no clicking needed)
    const directTabContent = await page.evaluate(() => {
      let extracted = '';

          // Elementor Advanced Tabs - all content is in DOM, just hidden
          const elementorTabs = Array.from(document.querySelectorAll('.eael-advance-tabs'));
          if (elementorTabs.length > 0) {
            for (const tabContainer of elementorTabs) {
          const tabs = tabContainer.querySelectorAll('.eael-tab-item-trigger');
          const contents = tabContainer.querySelectorAll('.eael-tab-content-item');

          if (tabs.length === contents.length && tabs.length > 0) {
            for (let i = 0; i < tabs.length; i++) {
              const categoryName = (tabs[i] as HTMLElement).innerText?.trim() || '';
              const categoryContent = (contents[i] as HTMLElement).innerText?.trim() || '';

              if (categoryName && categoryContent && categoryContent.length > 50) {
                extracted += `\n\n=== ${categoryName.toUpperCase()} ===\n\n${categoryContent}`;
              }
            }
          }
        }
      }

      // Jet Tabs - similar approach
      const jetTabs = Array.from(document.querySelectorAll('.jet-tabs'));
      if (jetTabs.length > 0 && extracted.length === 0) {
        for (const tabContainer of jetTabs) {
          const controls = tabContainer.querySelectorAll('.jet-tabs__control');
          const contents = tabContainer.querySelectorAll('.jet-tabs__content');

          if (controls.length === contents.length && controls.length > 0) {
            for (let i = 0; i < controls.length; i++) {
              const categoryName = (controls[i] as HTMLElement).innerText?.trim() || '';
              const categoryContent = (contents[i] as HTMLElement).innerText?.trim() || '';

              if (categoryName && categoryContent && categoryContent.length > 50) {
                extracted += `\n\n=== ${categoryName.toUpperCase()} ===\n\n${categoryContent}`;
              }
            }
          }
        }
      }

      // Generic ARIA tabs (works with many frameworks)
      if (extracted.length === 0) {
        // Only look for tabs NOT in header/nav/footer (avoid navigation tabs)
        const mainContent = document.querySelector('main, [role="main"], article, section') || document.body;
        const tabTriggers = Array.from(mainContent.querySelectorAll('[role="tab"]')).filter(tab => !tab.closest('header, nav, footer'));
        const tabPanels = Array.from(mainContent.querySelectorAll('[role="tabpanel"]')).filter(panel => !panel.closest('header, nav, footer'));

        if (tabTriggers.length === tabPanels.length && tabTriggers.length > 1) {
          let tempExtracted = '';
          for (let i = 0; i < tabTriggers.length; i++) {
            const categoryName = (tabTriggers[i] as HTMLElement).innerText?.trim() || '';
            const categoryContent = (tabPanels[i] as HTMLElement).innerText?.trim() || '';

            if (categoryName && categoryContent && categoryContent.length > 50) {
              tempExtracted += `\n\n=== ${categoryName.toUpperCase()} ===\n\n${categoryContent}`;
            }
          }

          // Validate content looks like menu (has prices or food keywords)
          const lowerTemp = tempExtracted.toLowerCase();
          const withCurrency = (tempExtracted.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
          const withoutCurrency = (tempExtracted.match(/\b\d+\.\d{2}\b/g) || []).length;
          const hasPrices = (withCurrency + withoutCurrency) > 3;
          const foodKeywords = ['appetizer', 'entree', 'entrée', 'dessert', 'burger', 'pizza', 'salad', 'sandwich'];
          const hasFoodKeywords = foodKeywords.some(kw => lowerTemp.includes(kw));

          if (hasPrices || hasFoodKeywords) {
            extracted = tempExtracted;
          }
        }
      }

      // Bootstrap tabs
      if (extracted.length === 0) {
        const mainContent = document.querySelector('main, [role="main"], article, section') || document.body;
        const bootstrapTabContainers = Array.from(mainContent.querySelectorAll('.nav-tabs, [role="tablist"]')).filter(container => !container.closest('header, nav, footer'));

        for (const container of bootstrapTabContainers) {
          const tabs = Array.from(container.querySelectorAll('[data-toggle="tab"], [data-bs-toggle="tab"], .nav-link')) as HTMLElement[];
          if (tabs.length > 1) {
            let tempExtracted = '';
            for (const tab of tabs) {
              const target = tab.getAttribute('data-target') || tab.getAttribute('data-bs-target') || tab.getAttribute('href');
              if (target && target.startsWith('#')) {
                const panelId = target.slice(1);
                const panel = document.getElementById(panelId);
                if (panel) {
                  const categoryName = (tab as HTMLElement).innerText?.trim() || '';
                  const categoryContent = (panel as HTMLElement).innerText?.trim() || '';

                  if (categoryName && categoryContent && categoryContent.length > 50) {
                    tempExtracted += `\n\n=== ${categoryName.toUpperCase()} ===\n\n${categoryContent}`;
                  }
                }
              }
            }

            // Validate content looks like menu
            if (tempExtracted.length > 0) {
              const lowerTemp = tempExtracted.toLowerCase();
              const withCurrency = (tempExtracted.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
              const withoutCurrency = (tempExtracted.match(/\b\d+\.\d{2}\b/g) || []).length;
              const hasPrices = (withCurrency + withoutCurrency) > 3;
              const foodKeywords = ['appetizer', 'entree', 'entrée', 'dessert', 'burger', 'pizza', 'salad', 'sandwich'];
              const hasFoodKeywords = foodKeywords.some(kw => lowerTemp.includes(kw));

              if (hasPrices || hasFoodKeywords) {
                extracted = tempExtracted;
                break;
              }
            }
          }
        }
      }

      return extracted;
    });

    // Validate direct tab content has menu-like characteristics
    if (directTabContent && directTabContent.length > 500) {
      const lowerContent = directTabContent.toLowerCase();
      const withCurrency = (directTabContent.match(/[$€£¥₹₽¢]\s?\d+\.?\d*/g) || []).length;
      const withoutCurrency = (directTabContent.match(/\b\d+\.\d{2}\b/g) || []).length;
      const priceCount = withCurrency + withoutCurrency;
      const menuKeywords = ['appetizer', 'entree', 'entrée', 'dessert', 'burger', 'pizza', 'salad', 'sandwich', 'beverage', 'drink'];
      const hasMenuKeywords = menuKeywords.some(kw => lowerContent.includes(kw));

      if (priceCount > 5 || hasMenuKeywords) {
        console.log('[Scraper] ✅ Extracted all tab content directly (no clicking needed):', directTabContent.length, 'chars,', priceCount, 'prices');
        return directTabContent;
      }
    }

    // Check for PDF or image-only menus (known limitation)
    const hasPdfOrImageMenu = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[];
      const hasPdf = links.some(link => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        const text = (link.textContent || '').toLowerCase();
        return href.endsWith('.pdf') || (href.includes('pdf') && text.includes('menu'));
      });

      const images = Array.from(document.querySelectorAll('img'));
      const hasMenuImages = images.filter(img => {
        const alt = (img.alt || '').toLowerCase();
        const src = (img.src || '').toLowerCase();
        return (alt.includes('menu') || src.includes('menu')) &&
               !alt.includes('logo') && !src.includes('logo');
      }).length > 3;

      return { hasPdf, hasMenuImages };
    });

    if (hasPdfOrImageMenu.hasPdf) {
      console.warn('[Scraper] ⚠️  PDF menu detected - content may be limited');
    }
    if (hasPdfOrImageMenu.hasMenuImages) {
      console.warn('[Scraper] ⚠️  Image-only menu detected - text extraction may be incomplete');
    }

    // Extract initial content
    console.log('[Scraper] Starting scroll for lazy content...');
    await scrollForLazyContent(page);
    console.log('[Scraper] Scroll complete, extracting text...');

    const initialText = await page.evaluate(() => document.body.innerText || '');
    allText += initialText;
    const initNorm = initialText.replace(/\s+/g, ' ');
    seenContent.add(initNorm.slice(0, 300) + '::' + initNorm.slice(-300));

    console.log('[Scraper] Initial content:', initialText.length, 'chars');

    // Classify the initial content quality using GPT
    const initialClassification = await classifyContentWithGPT(initialText);
    console.log(`[Content Quality] Initial content: score ${initialClassification.score}/100, confidence ${initialClassification.confidence}`);

    // If we already got truly excellent menu content (>85) with high confidence, skip all category clicking
    if (initialClassification.score > 85 && initialClassification.confidence > 0.8) {
      console.log('[Scraper] ✅ Excellent menu content found, skipping category navigation');
      return allText;
    }

    // Be less conservative - only use conservative mode for very good content
    const conservativeMode = initialClassification.score > 70 && initialClassification.confidence > 0.7;

    // Detect categories
    const categories = await page.evaluate(() => {
      type Cat = { text: string; href: string; isNavLink: boolean };
      const out: Cat[] = [];
      const seenText = new Set<string>();

      // Helper function to check if element should be excluded
      const shouldExclude = (el: Element, text: string): boolean => {
        const textLower = text.toLowerCase();
        const href = (el.getAttribute('href') || '').toLowerCase();

        // CRITICAL: Always exclude if in footer (prevents Google Maps, directions, etc.)
        if (el.closest('footer')) {
          return true;
        }

        // Exclude common non-menu actions
        const excludePatterns = [
          'order now', 'order online', 'start order', 'place order',
          'contact us', 'contact', 'get in touch',
          'find location', 'locations', 'find us', 'nearby location', 'our locations',
          'directions', 'view map', 'get directions', 'map',
          'reserve', 'book now', 'reservation', 'book a table',
          'cart', 'checkout', 'shopping cart',
          'sign in', 'log in', 'login', 'sign up', 'register',
          'about us', 'about', 'our story',
          'careers', 'join us', 'jobs',
          'gift card', 'catering', 'gift cards',
          'group booking', 'group bookings', 'private event', 'private events',
          'home', 'gallery', 'press', 'news', 'blog', 'instagram', 'facebook', 'twitter'
        ];

        // Check if text matches excluded patterns
        if (excludePatterns.some(pattern => textLower === pattern || textLower.includes(pattern))) {
          return true;
        }

        // Exclude Google Maps and external navigation links
        const excludeHrefPatterns = [
          'google.com/maps', 'maps.google', 'goo.gl/maps',
          '/order', '/contact', '/location', '/cart', '/checkout',
          '/about', '/careers', '/catering', '/reserve', '/book',
          '/group-booking', '/group-bookings', '/private-event', '/private-events',
          '/home', '/gallery', '/press', '/news', '/blog',
          'instagram.com', 'facebook.com', 'twitter.com', 'tiktok.com', 'linkedin.com'
        ];

        if (excludeHrefPatterns.some(pattern => href.includes(pattern))) {
          return true;
        }

        // CRITICAL: Block outbound links UNLESS they're menu/order related
        if (href.startsWith('http')) {
          try {
            const currentDomain = window.location.hostname;
            const linkUrl = new URL(href);
            const linkDomain = linkUrl.hostname;

            // If different domain, only allow if it's a known ordering platform or menu-related
            if (linkDomain !== currentDomain &&
                linkDomain.replace('www.', '') !== currentDomain.replace('www.', '')) {

              // Whitelist: ordering platforms and menu services
              const menuPlatforms = [
                'clover.com', 'ubereats.com', 'doordash.com', 'grubhub.com',
                'seamless.com', 'postmates.com', 'skipthedishes.ca', 'ritual.co',
                'chownow.com', 'toasttab.com', 'square.site', 'touchbistro.com',
                'foodbam.com', 'menufy.com', 'order.online', 'bentobox.com',
                'mealsy.ca', 'onlineordering.mealsy.ca'
              ];

              const isMenuPlatform = menuPlatforms.some(platform => linkDomain.includes(platform));
              const hasMenuKeywords = textLower.includes('menu') || textLower.includes('order') ||
                                     href.includes('menu') || href.includes('order');

              // Block if it's outbound AND not a menu platform
              if (!isMenuPlatform && !hasMenuKeywords) {
                return true; // Exclude outbound non-menu links
              }
            }
          } catch (_e) {
            // If URL parsing fails, exclude it to be safe
            return true;
          }
        }

        // Check if element is in main site navigation (NOT menu navigation)
        const navElement = el.closest('nav, header');
        if (navElement) {
          const navClasses = (navElement.className || '').toString().toLowerCase();
          const navId = (navElement.id || '').toString().toLowerCase();

          // If nav/header contains "menu" in class/id, it's likely menu navigation - DON'T exclude
          if (navClasses.includes('menu') || navId.includes('menu')) {
            return false; // Don't exclude menu navigation
          }

          // Otherwise, it's main site navigation - exclude
          return true;
        }

        // Check if element or immediate parent has site navigation-specific classes (not menu navigation)
        const navClasses = ['navbar', 'nav-menu', 'navigation', 'nav-bar', 'nav-link', 'nav-item', 'elementor-nav-menu', 'footer-menu', 'main-nav', 'primary-nav'];
        const elementClasses = (el.className || '').toString().toLowerCase();
        const parentClasses = (el.parentElement?.className || '').toString().toLowerCase();

        // Don't exclude if classes suggest menu navigation
        if (elementClasses.includes('menu') || parentClasses.includes('menu')) {
          return false;
        }

        if (navClasses.some(navClass => elementClasses.includes(navClass) || parentClasses.includes(navClass))) {
          return true;
        }

        return false;
      };

      // Strategy 1: Menu containers
      const menuContainers = Array.from(document.querySelectorAll(
        '[id*="menu-grid"], [class*="menu-grid"], [class*="menu-nav"], [class*="category"], [class*="MuiGrid-container"], section[class*="menu"], .menu-categories, [class*="tabs"], [class*="tab-"], .jet-tabs__control-wrapper, .jet-tabs, .eael-advance-tabs, .eael-tabs-nav'
      ));

      if (menuContainers.length > 0) {
        for (const container of menuContainers) {
          const clickables = Array.from(container.querySelectorAll('a, button, [role="button"], [role="tab"], [onclick], [class*="card"], [class*="item"], [class*="tab"], span[data-filter], [class*="lte-tab"], .jet-tabs__control, .eael-tab-item-trigger'));

          for (const el of clickables) {
            const text = (el.textContent || '').trim();
            const rect = (el as HTMLElement).getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) continue;
            if (text.length < 3 || text.length > 200) continue;
            if (seenText.has(text)) continue;

            // Skip concatenated text (e.g., "LUNCHDINNERBRUNCHDESSERTCOCKTAILWINE")
            if (text.length > 100 && !text.includes(' ')) continue;

            // Skip if text is ALL CAPS and contains multiple category-like words without spaces
            const hasMultipleCapsWords = /^[A-Z]{15,}$/.test(text);
            if (hasMultipleCapsWords) continue;

            // Skip excluded patterns
            if (shouldExclude(el, text)) continue;

            // Check if element is a tab/filter - these can be smaller
            const isTabElement =
              el.hasAttribute('role') && el.getAttribute('role') === 'tab' ||
              el.hasAttribute('data-filter') ||
              el.classList.contains('lte-tab') ||
              el.classList.contains('jet-tabs__control') ||
              el.classList.contains('eael-tab-item-trigger') ||
              el.matches('[class*="tab-"]') ||
              el.matches('[class*="jet-tab"]');

            const minSize = isTabElement ? 10 : 50; // Tabs can be smaller
            const minHeight = isTabElement ? 10 : 20;

            if (rect.width >= minSize && rect.height >= minHeight) {
              const href = (el.getAttribute('href') || '').trim();
              const isNavLink = !!href && !href.startsWith('#') && !href.startsWith('javascript') && href !== '/';
              out.push({ text, href: href || '#', isNavLink });
              seenText.add(text);
            }
          }
        }
      }

      // Filter out duplicate lowercase versions (e.g., "wine" when we already have "WINE")
      const upperCaseTexts = new Set(out.map(c => c.text.toUpperCase()));
      const filtered = out.filter(c => {
        // Keep if it's the uppercase version, or if there's no uppercase equivalent
        return c.text === c.text.toUpperCase() || !upperCaseTexts.has(c.text.toUpperCase());
      });

      // Strategy 2: Fallback (more conservative - avoid navbar items)
      if (filtered.length < 3) {
        // Only look in main content area, not navbar/header/footer
        const mainContent = document.querySelector('main, [role="main"], #main, .main-content, [class*="content-area"]') || document.body;
        const allClickables = Array.from(mainContent.querySelectorAll('a, button, [role="button"], [onclick]'));

        for (const el of allClickables) {
          const text = (el.textContent || '').trim();
          const rect = (el as HTMLElement).getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) continue;
          if (text.length < 3 || text.length > 200) continue;
          if (seenText.has(text)) continue;

          const textLower = text.toLowerCase();
          if (textLower === 'skip to main content' || textLower === 'skip to content') continue;

          // Use the same exclusion logic
          if (shouldExclude(el, text)) continue;

          const isLargeCard = rect.width >= 150 && rect.height >= 100;
          const isWideLink = rect.width >= 200 && rect.height >= 30;
          const isMediumElement = rect.width >= 120 && rect.height >= 50;

          if (isLargeCard || isWideLink || isMediumElement) {
            const href = (el.getAttribute('href') || '').trim();
            const isNavLink = !!href && !href.startsWith('#') && !href.startsWith('javascript') && href !== '/';
            filtered.push({ text, href: href || '#', isNavLink });
            seenText.add(text);
          }
        }
      }

      return filtered.slice(0, 30); // Limit to 30 categories max
    });

    console.log('[Scraper] Found', categories.length, 'categories');

    // In conservative mode, limit categories and prioritize quality over quantity
    const maxCategories = conservativeMode ? 8 : 15;
    const filteredCategories = categories.slice(0, maxCategories);

    const navLinks = filteredCategories.filter(c => c.isNavLink && c.href);
    const inPageTabs = filteredCategories.filter(c => !c.isNavLink);

    const menuBaseUrl = page.url();

    // Process in-page tabs
    let processedTabs = 0;
    for (let i = 0; i < inPageTabs.length; i++) {
      const category = inPageTabs[i];

      try {
        // Skip concatenated text
        if (category.text.length > 100) continue;

        const clicked = await page.evaluate((text) => {
          const normalizeText = (str: string) => {
            return str.toLowerCase().replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
          };

          // CRITICAL: Check if element should be excluded (must match category detection logic)
          const shouldExclude = (el: Element, text: string): boolean => {
            const textLower = text.toLowerCase();
            const href = (el.getAttribute('href') || '').toLowerCase();

            // Exclude footer always
            if (el.closest('footer')) {
              return true;
            }

            // Exclude common non-menu actions by text
            const excludePatterns = [
              'order now', 'order online', 'start order', 'place order',
              'contact us', 'contact', 'get in touch',
              'find location', 'locations', 'find us', 'nearby location', 'our locations',
              'directions', 'view map', 'get directions', 'map',
              'reserve', 'book now', 'reservation', 'book a table',
              'cart', 'checkout', 'shopping cart',
              'sign in', 'log in', 'login', 'sign up', 'register',
              'about us', 'about', 'our story',
              'careers', 'join us', 'jobs',
              'gift card', 'catering', 'gift cards',
              'group booking', 'group bookings', 'private event', 'private events',
              'home', 'gallery', 'press', 'news', 'blog', 'instagram', 'facebook', 'twitter'
            ];

            if (excludePatterns.some(pattern => textLower === pattern || textLower.includes(pattern))) {
              return true;
            }

            // Exclude Google Maps and external navigation links
            const excludeHrefPatterns = [
              'google.com/maps', 'maps.google', 'goo.gl/maps',
              '/order', '/contact', '/location', '/cart', '/checkout',
              '/about', '/careers', '/catering', '/reserve', '/book',
              '/group-booking', '/group-bookings', '/private-event', '/private-events',
              '/home', '/gallery', '/press', '/news', '/blog',
              'instagram.com', 'facebook.com', 'twitter.com'
            ];

            if (excludeHrefPatterns.some(pattern => href.includes(pattern))) {
              return true;
            }

            // Check if element is in main site navigation (NOT menu navigation)
            const navElement = el.closest('nav, header');
            if (navElement) {
              const navClasses = (navElement.className || '').toString().toLowerCase();
              const navId = (navElement.id || '').toString().toLowerCase();

              // If nav/header contains "menu" in class/id, it's likely menu navigation - DON'T exclude
              if (navClasses.includes('menu') || navId.includes('menu')) {
                return false; // Don't exclude menu navigation
              }

              // Otherwise, it's main site navigation - exclude
              return true;
            }

            // Check if element has site navigation classes
            const navClasses = ['navbar', 'nav-menu', 'navigation', 'nav-bar', 'nav-link', 'nav-item', 'elementor-nav-menu', 'footer-menu', 'main-nav', 'primary-nav'];
            const elementClasses = (el.className || '').toString().toLowerCase();
            const parentClasses = (el.parentElement?.className || '').toString().toLowerCase();

            // Don't exclude if classes suggest menu navigation
            if (elementClasses.includes('menu') || parentClasses.includes('menu')) {
              return false;
            }

            if (navClasses.some(navClass => elementClasses.includes(navClass) || parentClasses.includes(navClass))) {
              return true;
            }

            return false;
          };

          const normalizedTarget = normalizeText(text);

          // Strategy 1: Try data-filter tabs first (for tab-based menus)
          const dataFilterElements = Array.from(document.querySelectorAll('[data-filter]'));
          for (const el of dataFilterElements) {
            const elText = (el.textContent || '').trim();
            if (shouldExclude(el, elText)) continue;

            const normalizedElText = normalizeText(elText);

            if (normalizedElText === normalizedTarget) {
              const rect = (el as HTMLElement).getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                (el as HTMLElement).click();
                return true;
              }
            }
          }

          // Strategy 2: Try other tab/category selectors (prioritize specific selectors)
          const selectors = [
            '.eael-tab-item-trigger',
            '.jet-tabs__control',
            '[role="tab"]',
            'span[class*="tab"]',
            'button[class*="tab"]',
            'li[class*="tab"]',
            '[onclick]',
            '[class*="card"], [class*="tile"], [class*="item"]',
            'div[class*="MuiGrid"], div[class*="category"]',
            'a[href^="#"]',
            'a, button, [role="button"]'
          ];

          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector));

            for (const el of elements) {
              const elText = (el.textContent || '').trim();
              if (shouldExclude(el, elText)) continue;

              const normalizedElText = normalizeText(elText);

              const isExactMatch = normalizedElText === normalizedTarget;
              const startsWithTarget = normalizedElText.startsWith(normalizedTarget);
              const containsTarget = normalizedElText.includes(normalizedTarget) && normalizedElText.length <= normalizedTarget.length + 100;

              if (isExactMatch || startsWithTarget || containsTarget) {
                const rect = (el as HTMLElement).getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  (el as HTMLElement).click();
                  return true;
                }
              }
            }
          }
          return false;
        }, category.text);

        if (clicked) {
          const urlBeforeClick = page.url();
          await delay(600); // Initial wait for click to register
          const urlAfterClick = page.url();

          if (urlAfterClick !== urlBeforeClick) {
            await delay(800); // Navigation detected
            await scrollForLazyContent(page);
          } else {
            // In-page tab change - wait for content to stabilize (smarter than fixed delay)
            try {
              await page.waitForFunction(
                () => {
                  // Check if active content is visible and has meaningful text
                  const elementorTab = document.querySelector('.eael-tab-content-item.active, .eael-tab-content-item[style*="display: block"]');
                  const jetTab = document.querySelector('.jet-tabs__content.active-content');
                  const tabPanel = document.querySelector('[role="tabpanel"]:not([aria-hidden="true"])');

                  const activeContent = elementorTab || jetTab || tabPanel;
                  if (activeContent) {
                    const text = (activeContent as HTMLElement).innerText || '';
                    return text.trim().length > 50; // Has meaningful content
                  }
                  return false;
                },
                { timeout: 1500 }
              );
              await delay(200); // Small buffer after content appears
            } catch {
              // Timeout - fallback to fixed delay
              await delay(1000);
            }
          }

          const categoryContent = await page.evaluate(() => {
            // Strategy 1: Elementor Advanced Tabs - get active content panel
            const activeElementorTab = document.querySelector('.eael-tab-content-item.active, .eael-tab-content-item[style*="display: block"]');
            if (activeElementorTab) {
              const text = (activeElementorTab as HTMLElement).innerText || '';
              if (text.trim().length > 50) {
                return text;
              }
            }

            // Strategy 2: Jet Tabs - get active content panel
            const activeJetTabContent = document.querySelector('.jet-tabs__content.active-content');
            if (activeJetTabContent) {
              // Use textContent instead of innerText for Jet Tabs (innerText returns 0 for hidden/animated content)
              const innerText = (activeJetTabContent as HTMLElement).innerText || '';
              const textContent = (activeJetTabContent as HTMLElement).textContent || '';
              const text = innerText.length > 50 ? innerText : textContent;

              if (text.trim().length > 10) {
                return text;
              }
            }

            // Strategy 3: Get visible filtered items (for tab-based menus)
            const allFilterItems = Array.from(document.querySelectorAll('.lte-filter-item, [class*="filter-item"]'));
            const visibleItems = allFilterItems.filter(item => {
              const style = (item as HTMLElement).style.display;
              const computedStyle = window.getComputedStyle(item as HTMLElement);
              return style !== 'none' && computedStyle.display !== 'none';
            });

            if (visibleItems.length > 0) {
              return visibleItems.map(item => (item as HTMLElement).innerText || '').join('\n\n');
            }

            // Strategy 4: Get items with show/active classes (excluding tab controls and nav)
            const showItems = Array.from(document.querySelectorAll('.show-item, .show, .active:not([class*="control"]):not([class*="trigger"]):not(nav):not(header)'));
            if (showItems.length > 0) {
              const content = showItems.map(item => (item as HTMLElement).innerText || '').join('\n\n');
              if (content.trim().length > 50) {
                return content;
              }
            }

            // Strategy 5: Look for tab panels with aria-hidden="false" or role="tabpanel"
            const visibleTabPanel = document.querySelector('[role="tabpanel"]:not([aria-hidden="true"]), [role="tabpanel"][style*="display: block"]');
            if (visibleTabPanel) {
              const text = (visibleTabPanel as HTMLElement).innerText || '';
              if (text.trim().length > 50) {
                return text;
              }
            }

            // Fallback to main content area (but exclude nav/header/footer)
            const scope = (document.querySelector('main, [role="main"], #main, .main, article') as HTMLElement) || document.body;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scope.innerHTML;

            // Remove navigation, header, footer from temp copy
            tempDiv.querySelectorAll('nav, header, footer').forEach(el => el.remove());

            return tempDiv.innerText || scope.innerText || document.body.innerText || '';
          });

          const norm = categoryContent.replace(/\s+/g, ' ').trim();
          // Use more of the content for fingerprinting (500 chars from start, middle, end)
          const start = norm.slice(0, 500);
          const middle = norm.slice(Math.floor(norm.length / 2) - 250, Math.floor(norm.length / 2) + 250);
          const end = norm.slice(-500);
          const fingerprint = start + '::' + middle + '::' + end;

          if (!seenContent.has(fingerprint)) {
            allText += '\n\n=== ' + category.text.toUpperCase() + ' ===\n\n' + categoryContent;
            seenContent.add(fingerprint);
          }

          processedTabs++;

          // Early exit check: if we have substantial content and processed enough tabs, stop
          if (processedTabs >= 3 && allText.length > 2000) {
            const currentClassification = await classifyContentWithGPT(allText);
            if (currentClassification.score > 70 && currentClassification.confidence > 0.7) {
              console.log(`[Early Exit] Good content found after ${processedTabs} tabs (score: ${currentClassification.score}, confidence: ${currentClassification.confidence}), stopping category navigation`);
              break;
            }
          }

          // More aggressive early exit: stop after 6 tabs even with decent content
          if (processedTabs >= 6) {
            const currentClassification = await classifyContentWithGPT(allText);
            if (currentClassification.score > 60 && currentClassification.confidence > 0.6) {
              console.log(`[Early Exit] Decent content found after ${processedTabs} tabs (score: ${currentClassification.score}), stopping to avoid over-processing`);
              break;
            }
          }
        }
      } catch (_error) {
        // Continue
      }
    }

    // Process navigation links (limit to 10 to avoid timeouts)
    for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
      try {
        const category = navLinks[i];
        const absoluteUrl = new URL(category.href, menuBaseUrl).href;

        if (absoluteUrl.split('#')[0] === menuBaseUrl.split('#')[0]) continue;

        await page.goto(absoluteUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await delay(800);

        await dismissPopups(page);
        await scrollForLazyContent(page);

        const categoryContent = await page.evaluate(() => {
          const scope = (document.querySelector('main, [role="main"], #main, .main') as HTMLElement) || document.body;
          return scope.innerText || document.body.innerText || '';
        });

        const norm = categoryContent.replace(/\s+/g, ' ');
        const fingerprint = norm.slice(0, 250) + '::' + norm.slice(-250);

        if (!seenContent.has(fingerprint)) {
          allText += '\n\n=== ' + category.text.toUpperCase() + ' ===\n\n' + categoryContent;
          seenContent.add(fingerprint);
        }
      } catch (_navError) {
        // Continue
      }
    }

    return allText;
  } catch (error) {
    console.error('[Scraper] Category extraction error:', error);
    await scrollForLazyContent(page);
    return await page.evaluate(() => document.body.innerText || '');
  }
}

/**
 * Scroll for lazy content - HIGHLY OPTIMIZED (10x faster)
 */
async function scrollForLazyContent(page: Page): Promise<void> {
  try {
    // Detect if we're on a SPA that might need more aggressive scrolling
    const isSPA = await page.evaluate(() => {
      return !!(document.querySelector('#root, #app, [id*="react"], [id*="vue"]'));
    });

    console.log(`[Scraper] Scrolling (SPA mode: ${isSPA})...`);

    const scrollStats = await page.evaluate(async (needsSlowScroll) => {
      // Window scrolling - more aggressive for SPAs
      const scrollStep = window.innerHeight;
      let scrollAttempts = 0;
      const maxScrollAttempts = needsSlowScroll ? 15 : 20; // Increased limits - prioritize completeness over speed
      const scrollDelay = needsSlowScroll ? 500 : 100; // Longer delays for SPAs to load content
      let lastHeight = document.body.scrollHeight;
      let stableCount = 0;

      console.log(`[Scroll] Starting - bodyHeight: ${document.body.scrollHeight}, windowHeight: ${window.innerHeight}`);

      while (scrollAttempts < maxScrollAttempts) {
        const currentPosition = window.scrollY;
        const currentHeight = document.body.scrollHeight;
        const targetPosition = Math.min(currentPosition + scrollStep, currentHeight);

        console.log(`[Scroll] Attempt ${scrollAttempts + 1}: scrolling from ${currentPosition} to ${targetPosition} (total height: ${currentHeight})`);
        window.scrollTo(0, targetPosition);
        await new Promise(r => setTimeout(r, scrollDelay));

        const afterScrollPos = window.scrollY;
        const afterScrollHeight = document.body.scrollHeight;
        console.log(`[Scroll] After scroll: position=${afterScrollPos}, bodyHeight=${afterScrollHeight}`);

        // Check if we've reached the bottom (with a small tolerance)
        const distanceFromBottom = afterScrollHeight - afterScrollPos - window.innerHeight;
        const reachedBottom = distanceFromBottom <= 50; // 50px tolerance

        if (reachedBottom) {
          console.log(`[Scroll] Reached bottom (distance: ${distanceFromBottom}px)`);
          // For SPAs, wait a bit more and check if content loads
          if (needsSlowScroll) {
            await new Promise(r => setTimeout(r, scrollDelay));
            const newHeight = document.body.scrollHeight;
            if (newHeight === afterScrollHeight) {
              console.log('[Scroll] No new content loaded, stopping');
              break;
            } else {
              console.log(`[Scroll] New content loaded, height increased to ${newHeight}, continuing...`);
              lastHeight = newHeight;
            }
          } else {
            console.log('[Scroll] Reached bottom (non-SPA), stopping');
            break;
          }
        }

        // For SPAs, track height stability
        if (needsSlowScroll) {
          const newHeight = afterScrollHeight;
          if (newHeight === lastHeight) {
            stableCount++;
            console.log(`[Scroll] Height stable (${stableCount}/3)`);
            // If height hasn't changed for 3 scrolls and we're near bottom, we're done
            if (stableCount >= 3 && reachedBottom) {
              console.log('[Scroll] Height stable for 3 attempts and at bottom, stopping');
              break;
            }
          } else {
            stableCount = 0;
            lastHeight = newHeight;
            console.log(`[Scroll] Height increased to ${newHeight}`);
          }
        }

        scrollAttempts++;
      }

      // Final scroll to absolute bottom to ensure we got everything
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 200));
      console.log(`[Scroll] Final position: ${window.scrollY}/${document.body.scrollHeight}`);

      return {
        attempts: scrollAttempts,
        finalHeight: document.body.scrollHeight,
        finalPosition: window.scrollY
      };
    }, isSPA);

    console.log(`[Scraper] Scrolled ${scrollStats.attempts} times, final height: ${scrollStats.finalHeight}, final position: ${scrollStats.finalPosition}`);
  } catch (_error) {
    // Ignore scroll errors
  }
}

/**
 * Extract logo - OPTIMIZED
 */
async function extractLogo(page: Page): Promise<string | null> {
  try {
    const logo = await page.evaluate(() => {
      const extractBgImageUrl = (element: Element): string | null => {
        const style = window.getComputedStyle(element as HTMLElement);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1]) return match[1];
        }
        return null;
      };

      const looksLikeLogo = (url: string, width?: number, height?: number): boolean => {
        const lower = url.toLowerCase();

        // Explicit logo indicators
        if (lower.includes('logo')) return true;

        // Exclude obvious non-logos
        if (lower.includes('avatar') || lower.includes('placeholder')) return false;
        if (lower.includes('banner') || lower.includes('hero')) return false;
        if (lower.includes('cookie')) return false; // Exclude cookie icons
        if (lower.includes('revisit')) return false; // Exclude cookie consent icons
        if (lower.includes('gdpr')) return false; // Exclude GDPR icons

        // Exclude plugin/widget icons
        if (lower.includes('plugins/') || lower.includes('plugin/')) return false;
        if (lower.includes('widgets/') || lower.includes('widget/')) return false;

        // Allow small icons if they might be logos
        if (lower.includes('icon')) {
          // If dimensions provided, check if it's a reasonable logo size
          if (width && height) {
            return width >= 40 && width <= 500 && height >= 30 && height <= 300;
          }
          // Without dimensions, be conservative
          return false;
        }

        // Allow if it looks like it could be a brand asset
        if (lower.includes('brand')) return true;

        // Default: allow unless explicitly excluded
        return true;
      };

      type LogoCandidate = { url: string; score: number };
      const candidates: LogoCandidate[] = [];

      // Helper to get image URL from lazy-loaded or regular images
      const getImageUrl = (img: HTMLImageElement): string | null => {
        // Check standard src
        if (img.src && img.src.startsWith('http')) {
          return img.src;
        }

        // Check lazy loading attributes (LiteSpeed, lazysizes, etc.)
        const lazyAttrs = [
          'data-src',
          'data-lazy-src',
          'data-original',
          'data-srcset',
          'data-lazy',
        ];

        for (const attr of lazyAttrs) {
          const value = img.getAttribute(attr);
          if (value) {
            // Handle protocol-relative URLs
            if (value.startsWith('//')) {
              return 'https:' + value;
            }
            if (value.startsWith('http')) {
              return value;
            }
          }
        }

        return null;
      };

      // Strategy 1: Logo elements
      const brandElements = Array.from(document.querySelectorAll('[class*="logo" i], [id*="logo" i], [aria-label*="logo" i], [class*="brand" i], [id*="brand" i]'));

      for (const el of brandElements) {
        const rect = (el as HTMLElement).getBoundingClientRect();

        const bgUrl = extractBgImageUrl(el);
        if (bgUrl && bgUrl.startsWith('http') && looksLikeLogo(bgUrl, rect.width, rect.height)) {
          candidates.push({ url: bgUrl, score: 1000 + (rect.top < 150 ? 100 : 0) });
        }

        const img = el.querySelector('img');
        if (img) {
          const imgUrl = getImageUrl(img);
          if (imgUrl) {
            const imgRect = img.getBoundingClientRect();
            if (looksLikeLogo(imgUrl, imgRect.width, imgRect.height)) {
              candidates.push({ url: imgUrl, score: 900 + (imgRect.top < 150 ? 100 : 0) });
            }
          }
        }
      }

      // Strategy 2: Header/nav images
      const headerElements = Array.from(document.querySelectorAll('header, nav, [class*="header" i], [class*="navbar" i]'));

      for (const header of headerElements) {
        const headerRect = (header as HTMLElement).getBoundingClientRect();
        if (headerRect.top > 200) continue;

        // Background images in header
        const allInHeader = Array.from(header.querySelectorAll('*'));
        for (const el of allInHeader) {
          const bgUrl = extractBgImageUrl(el);
          if (bgUrl && bgUrl.startsWith('http')) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            const isTopLeft = rect.left < 400 && rect.top < 150;
            const isReasonableSize = rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300;

            if (isReasonableSize && looksLikeLogo(bgUrl, rect.width, rect.height)) {
              candidates.push({ url: bgUrl, score: 700 + (isTopLeft ? 200 : 0) });
            }
          }
        }

        // Images in header
        const headerImages = Array.from(header.querySelectorAll('img'));
        for (const img of headerImages) {
          const imgUrl = getImageUrl(img);
          if (!imgUrl) continue;

          const rect = img.getBoundingClientRect();
          const isTopLeft = rect.left < 400 && rect.top < 150;
          const isReasonableSize = rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300;

          if (isReasonableSize && looksLikeLogo(imgUrl, rect.width, rect.height)) {
            candidates.push({ url: imgUrl, score: 600 + (isTopLeft ? 200 : 0) });
          }
        }
      }

      // Strategy 3: Any image with "logo" in src/alt/data-src
      const allImages = Array.from(document.querySelectorAll('img'));
      for (const img of allImages) {
        const imgUrl = getImageUrl(img);
        if (!imgUrl) continue;

        // Skip if it's a cookie/plugin/widget icon
        if (!looksLikeLogo(imgUrl)) continue;

        const alt = (img.alt || '').toLowerCase();
        const hasLogoKeyword = alt.includes('logo') || imgUrl.toLowerCase().includes('logo');

        if (hasLogoKeyword) {
          const rect = img.getBoundingClientRect();
          if (rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300) {
            candidates.push({ url: imgUrl, score: 500 });
          }
        }
      }

      // Strategy 4: Look for SVG logos (often missed)
      const svgElements = Array.from(document.querySelectorAll('svg[class*="logo" i], svg[id*="logo" i]'));
      for (const svg of svgElements) {
        const rect = (svg as SVGElement).getBoundingClientRect();
        if (rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300) {
          // Convert SVG to data URL or look for parent link
          const parentLink = svg.closest('a');
          if (parentLink) {
            const href = (parentLink as HTMLAnchorElement).href;
            // Check if parent link has logo in path
            if (href && href.toLowerCase().includes('logo')) {
              candidates.push({ url: href, score: 550 });
            }
          }

          // Try to serialize SVG as image (for inline SVGs)
          try {
            const svgString = new XMLSerializer().serializeToString(svg as SVGElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            candidates.push({ url: svgUrl, score: 450 });
          } catch (_e) {
            // Ignore serialization errors
          }
        }
      }

      // Favicon fallback (lowest priority)
      const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
      if (favicon && favicon.href && favicon.href.startsWith('http')) {
        candidates.push({ url: favicon.href, score: 100 });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        console.log('[Logo Extraction] Top 5 candidates:');
        candidates.slice(0, 5).forEach((c, idx) => {
          console.log(`  ${idx + 1}. ${c.url.slice(0, 80)}... (score: ${c.score})`);
        });
        return candidates[0].url;
      }

      console.log('[Logo Extraction] No logo candidates found');
      return null;
    });

    return logo;
  } catch (_error) {
    return null;
  }
}

/**
 * Extract color palette using AI vision analysis of homepage screenshot
 */
async function extractColorPalette(page: Page): Promise<ColorPalette> {
  try {
    console.log('[AI Color Extraction] Taking screenshot for AI analysis...');

    // Take a full-page screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: 'png'
    });

    // Convert to base64 for OpenAI API
    const base64Image = (screenshotBuffer as Buffer).toString('base64');

    console.log('[AI Color Extraction] Analyzing screenshot with OpenAI Vision API...');

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this restaurant website screenshot and extract the PRIMARY, SECONDARY, and ACCENT colors that best represent the brand.

Return colors as hex codes (e.g., #FF5733). Focus on:
- Primary: Main brand color (usually the most prominent/dominant)
- Secondary: Supporting brand color (often used for backgrounds, text, or accents)
- Accent: Highlight color (used for buttons, links, special elements)

Guidelines:
- Choose colors that are clearly part of the brand identity, not generic grays/blacks
- Prefer vibrant, distinctive colors over muted ones
- Consider colors used in logos, headers, buttons, and brand elements
- If unsure, choose the most visually prominent colors

Return your response as a JSON object with exactly these keys:
{
  "primary": "#HEXCODE",
  "secondary": "#HEXCODE",
  "accent": "#HEXCODE"
}

Only return valid hex color codes. If you cannot determine a color for a category, omit that key.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the AI response
    const aiResult = JSON.parse(response.choices[0].message.content || "{}");
    console.log('[AI Color Extraction] AI extracted colors:', aiResult);

    // Convert to our ColorPalette format and validate
    const palette: ColorPalette = {};

    if (aiResult.primary) {
      palette.primary = aiResult.primary.toUpperCase();
    }
    if (aiResult.secondary) {
      palette.secondary = aiResult.secondary.toUpperCase();
    }
    if (aiResult.accent) {
      palette.accent = aiResult.accent.toUpperCase();
    }

    console.log('[AI Color Extraction] Final AI-extracted palette:', palette);
    return palette;

  } catch (error) {
    console.error('[AI Color Extraction] Error:', error);

    // Fallback to original method if AI extraction fails
    console.log('[AI Color Extraction] Falling back to DOM-based extraction...');
    return await extractColorPaletteFallback(page);
  }
}

/**
 * Fallback color extraction using DOM analysis (original method)
 */
async function extractColorPaletteFallback(page: Page): Promise<ColorPalette> {
  try {
    return await page.evaluate(() => {
      // Helper to check if color is colorful (not grayscale)
      const isColorful = (r: number, g: number, b: number): boolean => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        // Color has at least 20 points difference between channels (not grayscale) - lowered from 30 to catch more colors
        return diff >= 20;
      };

      // Helper to get color brightness (0-255)
      const getBrightness = (r: number, g: number, b: number): number => {
        return (r * 299 + g * 587 + b * 114) / 1000;
      };

      // Helper to check if color is pure black or very dark (likely text color)
      const isBlackish = (r: number, g: number, b: number): boolean => {
        // Exclude pure black and very dark colors (below 20 on all channels)
        return r < 20 && g < 20 && b < 20;
      };

      // Helper to check if color is whitish
      const isWhitish = (r: number, g: number, b: number): boolean => {
        return r > 245 && g > 245 && b > 245;
      };

      const toHex = (color: string): string | null => {
        if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') return null;

        if (color.startsWith('#')) {
          return color.length === 7 ? color.toUpperCase() : null;
        }

        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);

          // Ignore very light colors (near-white backgrounds) and very dark colors (near-black text)
          if (isWhitish(r, g, b) || isBlackish(r, g, b)) return null;

          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
          return hex;
        }

        return null;
      };

      type ColorScore = { color: string; score: number; r: number; g: number; b: number };
      const colorScores: ColorScore[] = [];

      // Comprehensive element selection for color extraction
      const brandSelectors = [
        // Buttons and CTAs
        'button', 'input[type="submit"]', 'input[type="button"]',
        '.btn', '.button', '[class*="btn"]', '[class*="button"]',
        '[class*="cta"]', '[class*="CTA"]', '[id*="cta"]', '[id*="CTA"]',
        '[class*="primary"]', '[class*="Primary"]', '[class*="main"]',
        '[class*="hero"]', '[class*="hero"]', '[class*="banner"]',

        // Links that look like buttons
        'a[class*="button"]', 'a[class*="btn"]', 'a[class*="cta"]',

        // Framework-specific buttons
        '[class*="et_pb_button"]', '[class*="elementor-button"]',
        '[class*="wp-block-button"]', '[class*="g-btn"]',
        '[class*="btn-primary"]', '[class*="btn-secondary"]',
        '[class*="btn-success"]', '[class*="btn-danger"]',
        '[class*="btn-warning"]', '[class*="btn-info"]',

        // Interactive elements
        '[role="button"]', '[role="link"]', '[role="tab"]',

        // Header/Navigation elements
        'header button', 'nav button', 'header a', 'nav a',
        '.navbar a', '.nav a', '.menu a',

        // Brand/Logo elements
        '[class*="brand"]', '[class*="Brand"]', '[id*="brand"]', '[id*="Brand"]',
        '[class*="logo"]', '[class*="Logo"]', '[id*="logo"]', '[id*="Logo"]',

        // Cards and feature elements
        '[class*="card"]', '[class*="feature"]', '[class*="promo"]',
        '[class*="highlight"]', '[class*="featured"]',

        // Theme colors and accents
        '[class*="accent"]', '[class*="theme"]', '[class*="color"]',
        '[class*="primary-color"]', '[class*="secondary-color"]',

        // Common color classes
        '[class*="red"]', '[class*="blue"]', '[class*="green"]',
        '[class*="orange"]', '[class*="purple"]', '[class*="pink"]',
        '[class*="yellow"]', '[class*="black"]', '[class*="white"]'
      ];

      // Get all elements
      const elements = Array.from(document.querySelectorAll(brandSelectors.join(', ')));

      // Also get elements with inline styles that might have brand colors
      const allStyledElements = Array.from(document.querySelectorAll('[style*="background"], [style*="color"], [style*="border"]'));
      const combinedElements = [...elements, ...allStyledElements];

      // Remove duplicates
      const uniqueElements = combinedElements.filter((el, index, arr) =>
        arr.findIndex(e => e === el) === index
      );

      console.log('[Color Extraction] Found', uniqueElements.length, 'potential color elements (from', elements.length, 'selectors +', allStyledElements.length, 'styled elements)');

      // Helper to extract colors from gradients
      const extractGradientColors = (gradientStr: string): string[] => {
        if (!gradientStr || !gradientStr.includes('gradient')) return [];

        // Extract color stops from linear-gradient() or radial-gradient()
        const colorMatches = gradientStr.match(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g);
        return colorMatches ? colorMatches.map(color => toHex(color)).filter(Boolean) as string[] : [];
      };

      // Helper to resolve CSS variables
      const resolveCssVariable = (value: string): string => {
        if (value.startsWith('var(')) {
          const varName = value.match(/var\(([^,)]+)/)?.[1];
          if (varName) {
            try {
              const resolved = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
              if (resolved && resolved !== value) {
                return resolved;
              }
            } catch (_e) {
              // Ignore CSS variable resolution errors
            }
          }
        }
        return value;
      };

      let debuggedButtons = 0;
      for (const el of uniqueElements) {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();

          // Skip hidden elements and very small elements
          if (rect.width < 10 || rect.height < 10 || rect.width === 0 || rect.height === 0) continue;

          // Get all color properties
          const bgColor = toHex(resolveCssVariable(style.backgroundColor));
          const textColor = toHex(resolveCssVariable(style.color));
          const borderColor = toHex(resolveCssVariable(style.borderColor));
          const borderTopColor = toHex(resolveCssVariable(style.borderTopColor));
          const borderRightColor = toHex(resolveCssVariable(style.borderRightColor));
          const borderBottomColor = toHex(resolveCssVariable(style.borderBottomColor));
          const borderLeftColor = toHex(resolveCssVariable(style.borderLeftColor));

          // Check for gradients in background
          const gradientColors = extractGradientColors(style.backgroundImage);

          // Check pseudo-elements more comprehensively
          const pseudoColors: string[] = [];
          const pseudoSelectors = ['::before', '::after', '::first-line', '::first-letter', '::selection'];

          for (const pseudo of pseudoSelectors) {
            try {
              const pseudoStyle = window.getComputedStyle(el, pseudo);
              const pseudoBg = toHex(resolveCssVariable(pseudoStyle.backgroundColor));
              const pseudoColor = toHex(resolveCssVariable(pseudoStyle.color));

              if (pseudoBg) pseudoColors.push(pseudoBg);
              if (pseudoColor) pseudoColors.push(pseudoColor);

              // Also check pseudo gradients
              const pseudoGradients = extractGradientColors(pseudoStyle.backgroundImage);
              pseudoColors.push(...pseudoGradients);
            } catch (_e) {
              // Ignore errors accessing pseudo-elements
            }
          }

          // Check inline styles for additional colors
          const inlineStyle = el.getAttribute('style');
          if (inlineStyle) {
            const inlineColors = extractGradientColors(inlineStyle);
            pseudoColors.push(...inlineColors);
          }

          // Debug first few buttons
          if (debuggedButtons < 5 && (el.tagName === 'BUTTON' || el.tagName === 'A' && el.className.toLowerCase().includes('button'))) {
            console.log('[Color Debug]', el.tagName, el.className, 'bg:', style.backgroundColor, '->', bgColor, 'text:', style.color, '->', textColor);
            debuggedButtons++;
          }

          // Collect all color sources
          const allColors = [
            bgColor, textColor, borderColor,
            borderTopColor, borderRightColor, borderBottomColor, borderLeftColor,
            ...gradientColors,
            ...pseudoColors
          ].filter(Boolean) as string[];

          // Remove duplicates
          const colors = allColors.filter((color, index, arr) => arr.indexOf(color) === index);

          for (const color of colors) {
            const rgb = color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
            const [r, g, b] = rgb;

            // Calculate score based on element importance and color properties
            let score = 0;

            // Element importance scoring (more balanced)
            let elementScore = 0;

            // Track if this color is a background vs text color
            const isBackgroundColor = color === bgColor || gradientColors.includes(color) || pseudoColors.includes(color);
            const isTextColor = color === textColor;

            // High priority elements - buttons and CTAs are most important
            const isButton = el.tagName === 'BUTTON' ||
                el.classList.contains('btn') ||
                el.classList.contains('button') ||
                el.className.toLowerCase().includes('button');

            if (isButton) {
              if (isBackgroundColor) {
                // MASSIVE BOOST: Button background colors are THE primary brand colors
                elementScore += 500; // Increased from 120 to ensure buttons always win
                console.log(`[Color Score] Button background: ${color} (+500)`);
              } else if (isTextColor) {
                // Button text is less important (usually white/black)
                elementScore += 20; // Reduced from 60
                console.log(`[Color Score] Button text: ${color} (+20)`);
              }
            }

            // Framework-specific button classes
            if (el.className.toLowerCase().includes('et_pb_button') ||
                el.className.toLowerCase().includes('elementor-button') ||
                el.className.toLowerCase().includes('wp-block-button') ||
                el.className.toLowerCase().includes('btn-primary') ||
                el.className.toLowerCase().includes('btn-secondary')) {
              if (isBackgroundColor) {
                elementScore += 400; // Huge boost for framework button backgrounds
                console.log(`[Color Score] Framework button background: ${color} (+400)`);
              } else if (isTextColor) {
                elementScore += 15; // Minimal for text
              }
            }

            // CTA and primary elements
            if (el.classList.contains('cta') ||
                el.classList.contains('CTA') ||
                el.className.toLowerCase().includes('cta') ||
                el.classList.contains('primary') ||
                el.classList.contains('Primary') ||
                el.className.toLowerCase().includes('primary')) {
              if (isBackgroundColor) {
                elementScore += 150; // Background colors of CTAs are important
              } else if (isTextColor) {
                elementScore += 30; // Text colors less important
              } else {
                elementScore += 60;
              }
            }

            // Hero/banner elements often contain brand colors
            if (el.className.toLowerCase().includes('hero') ||
                el.className.toLowerCase().includes('banner') ||
                el.className.toLowerCase().includes('featured')) {
              if (isBackgroundColor) {
                elementScore += 100; // Background colors preferred
              } else if (isTextColor) {
                elementScore += 25; // Text colors less important
              } else {
                elementScore += 50;
              }
            }

            // Header/Navigation elements (medium priority)
            if (el.closest('header') || el.closest('nav') ||
                el.className.toLowerCase().includes('navbar') ||
                el.className.toLowerCase().includes('nav')) {
              if (isBackgroundColor) {
                elementScore += 80; // Nav backgrounds are important (like teal header)
              } else if (isTextColor) {
                elementScore += 15; // Nav text less important
              } else {
                elementScore += 40;
              }
            }

            // Brand/Logo elements
            if (el.classList.toString().toLowerCase().includes('brand') ||
                el.classList.toString().toLowerCase().includes('logo') ||
                el.id.toLowerCase().includes('brand') ||
                el.id.toLowerCase().includes('logo')) {
              if (isBackgroundColor) {
                elementScore += 150; // Logo backgrounds are very important
              } else if (isTextColor) {
                elementScore += 100; // Logo text/fill colors are also important
              } else {
                elementScore += 90;
              }
            }

            // Color class indicators (e.g., "btn-red", "text-blue")
            if (el.className.toLowerCase().includes('red') ||
                el.className.toLowerCase().includes('blue') ||
                el.className.toLowerCase().includes('green') ||
                el.className.toLowerCase().includes('orange') ||
                el.className.toLowerCase().includes('purple') ||
                el.className.toLowerCase().includes('pink') ||
                el.className.toLowerCase().includes('yellow')) {
              if (isBackgroundColor) {
                elementScore += 80; // Named color backgrounds
              } else if (isTextColor) {
                elementScore += 30; // Named text colors less important
              } else {
                elementScore += 50;
              }
            }

            // PENALTY for heading text colors (H1, H2, H3, etc.) - often decorative
            if ((el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || 
                 el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6') && isTextColor) {
              elementScore -= 50; // Penalize heading text colors heavily
              console.log(`[Color Score] Heading text penalty: ${color} (-50)`);
            }

            // Penalty for plain links (often blue default color)
            if (el.tagName === 'A' &&
                !el.className.toLowerCase().includes('button') &&
                !el.className.toLowerCase().includes('btn') &&
                !el.className.toLowerCase().includes('cta') &&
                !el.closest('nav') &&
                !el.closest('header')) {
              elementScore -= 30;
            }

            // Position bonus - elements in top-left are often more important (but not for text)
            if (rect.top < 200 && rect.left < 400 && !isTextColor) {
              elementScore += 20;
            }

            // Size bonus - larger elements are more prominent (but heavily reduced for text colors)
            const area = rect.width * rect.height;
            if (!isTextColor) {
              // Background colors get full size bonus
              if (area > 10000) elementScore += 30; // Large elements
              else if (area > 5000) elementScore += 20; // Medium elements
              else if (area > 1000) elementScore += 10; // Small but visible elements
            } else {
              // Text colors get minimal size bonus
              if (area > 10000) elementScore += 5; // Reduced bonus for large text
            }

            // CRITICAL: General background vs text color adjustment
            if (isBackgroundColor && !isTextColor) {
              elementScore += 40; // Global bonus for background colors
              console.log(`[Color Score] Background color bonus: ${color} (+40)`);
            } else if (isTextColor && !isBackgroundColor) {
              elementScore -= 20; // Global penalty for text-only colors
              console.log(`[Color Score] Text color penalty: ${color} (-20)`);
            }

            // Color quality scoring (prioritize saturated, colorful colors)
            let colorScore = 0;

            // Calculate saturation first (most important for brand colors)
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            const brightness = getBrightness(r, g, b);

            // CRITICAL: Skip near-black colors completely (likely text colors)
            if (isBlackish(r, g, b)) {
              colorScore -= 500; // Massive penalty - we don't want black as a brand color
            }
            // Also heavily penalize very dark colors that might be text
            else if (brightness < 30 && saturation < 40) {
              colorScore -= 200; // Very dark + low saturation = likely dark text color
            }
            // Bonus for colorful (non-grayscale) colors
            else if (isColorful(r, g, b)) {
              colorScore += 80; // Strong bonus for colorful colors
            }

            // Brightness analysis (nuanced approach)
            // Medium brightness colors (40-200) are ideal for brand colors
            if (brightness >= 40 && brightness <= 200) {
              colorScore += 40; // Sweet spot for brand colors
            }
            // Very light colors (near white) - might be backgrounds
            else if (brightness > 240) {
              colorScore -= 60; // Strong penalty for near-white
            } else if (brightness > 220) {
              colorScore -= 30;
            }
            // Dark but not too dark
            else if (brightness >= 30 && brightness < 40) {
              colorScore += 10; // Slight bonus for dark but not black
            }

            // Pure grayscale penalty
            if (!isColorful(r, g, b)) {
              colorScore -= 50; // Heavy penalty for grayscale
            }

            // Saturation bonus for brand colors (VERY IMPORTANT)
            if (saturation > 100) {
              colorScore += 60; // Highly saturated colors are very likely brand colors
            } else if (saturation > 70) {
              colorScore += 40;
            } else if (saturation > 50) {
              colorScore += 20;
            } else if (saturation < 20) {
              colorScore -= 40; // Low saturation penalty (likely gray/text)
            }

            // Combine element and color scores
            score = elementScore + colorScore;

            // Find existing color or add new
            const existing = colorScores.find(cs => cs.color === color);
            if (existing) {
              existing.score += score;
            } else {
              colorScores.push({ color, score, r, g, b });
            }
          }
        }
      }

      // Sort by score
      colorScores.sort((a, b) => b.score - a.score);

      // Debug top scoring colors
      console.log('[Color Extraction] Top 10 colors by score:');
      colorScores.slice(0, 10).forEach(cs => {
        console.log(`  ${cs.color} (score: ${cs.score})`);
      });

      // Get distinct colors (filter out similar colors)
      const getDistinctColors = (prioritizeColors: string[] = []): string[] => {
        const distinct: string[] = [];

        // First, add any prioritized colors that have positive scores
        for (const priorityColor of prioritizeColors) {
          const existingScore = colorScores.find(cs => cs.color === priorityColor);
          if (existingScore && existingScore.score > 0) { // Must have positive score
            distinct.push(priorityColor);
            console.log(`[Color Extraction] Added prioritized color ${priorityColor} (score: ${existingScore.score})`);
          }
        }

        // Then add remaining high-scoring colors
        for (const cs of colorScores) {
          // Skip if already added
          if (distinct.includes(cs.color)) continue;

          // Skip colors with negative scores (these are likely black/gray text colors)
          if (cs.score <= 0) {
            console.log(`[Color Extraction] Skipping ${cs.color} (score: ${cs.score})`);
            continue;
          }

          // Skip if too similar to already selected
          let tooSimilar = false;
          for (const selected of distinct) {
            const rgb2 = selected.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
            const distance = Math.sqrt(
              Math.pow(cs.r - rgb2[0], 2) +
              Math.pow(cs.g - rgb2[1], 2) +
              Math.pow(cs.b - rgb2[2], 2)
            );

            if (distance < 40) {
              tooSimilar = true;
              break;
            }
          }

          if (!tooSimilar && cs.score > 50) { // Higher threshold for quality colors
            distinct.push(cs.color);
            console.log(`[Color Extraction] Added color ${cs.color} (score: ${cs.score})`);
          }

          if (distinct.length >= 5) break;
        }

        return distinct;
      };

      // Fallback strategies if we don't have enough good brand colors
      const fallbackColors = (): string[] => {
        const fallbacks: string[] = [];

        // Strategy 1: Check theme-color meta tag (HIGH PRIORITY)
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          const themeColor = toHex(themeColorMeta.getAttribute('content') || '');
          if (themeColor) {
            fallbacks.push(themeColor);
            console.log(`[Color Extraction] Found theme-color meta tag: ${themeColor}`);
          }
        }

        // Strategy 2: Check for CSS custom properties (CSS variables) - HIGHEST PRIORITY
        try {
          const rootStyles = window.getComputedStyle(document.documentElement);
          
          // Comprehensive list of CSS variable names used by various themes and frameworks
          const cssVars = [
            // Generic brand colors
            '--primary-color', '--brand-color', '--accent-color', '--secondary-color', '--theme-color',
            '--primary', '--brand', '--accent', '--secondary', '--theme',
            
            // WordPress/Hestia theme specific
            '--hestia-primary-color', '--hestia-accent-color', '--hestia-secondary-color',
            '--wp--preset--color--primary', '--wp--preset--color--accent', '--wp--preset--color--secondary',
            '--wp--preset--color--header-gradient',
            
            // Elementor
            '--e-global-color-primary', '--e-global-color-secondary', '--e-global-color-accent',
            
            // Other common frameworks
            '--color-primary', '--color-secondary', '--color-accent', '--color-brand',
            '--main-color', '--main-brand-color', '--site-color',
            '--link-color', '--button-color', '--cta-color'
          ];

          for (const varName of cssVars) {
            const varValue = rootStyles.getPropertyValue(varName).trim();
            if (varValue) {
              const resolvedColor = toHex(varValue);
              if (resolvedColor) {
                fallbacks.push(resolvedColor);
                console.log(`[Color Extraction] Found CSS variable ${varName}: ${resolvedColor}`);
              }
            }
          }
        } catch (e) {
          console.error('[Color Extraction] Error reading CSS variables:', e);
        }

        return fallbacks.filter((color, index, arr) => arr.indexOf(color) === index); // Remove duplicates
      };

      // Additional color extraction strategies (headings, frequency analysis)
      const additionalColorStrategies = (): string[] => {
        const additionalColors: string[] = [];

        // Strategy 1: Check for color in site title/headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, .site-title, .brand-name'));
        for (const heading of headings) {
          if (heading instanceof HTMLElement) {
            const style = window.getComputedStyle(heading);
            const color = toHex(style.color);
            if (color && isColorful(...color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16)) as [number, number, number])) {
              additionalColors.push(color);
            }
          }
        }

        // Strategy 2: Analyze most frequent colors across the page
        const allElements = Array.from(document.querySelectorAll('*')).slice(0, 100); // Limit for performance
        const colorFrequency = new Map<string, number>();

        for (const el of allElements) {
          if (el instanceof HTMLElement) {
            const style = window.getComputedStyle(el);
            const bgColor = toHex(style.backgroundColor);
            const textColor = toHex(style.color);

            if (bgColor && bgColor !== '#FFFFFF' && bgColor !== '#000000') {
              colorFrequency.set(bgColor, (colorFrequency.get(bgColor) || 0) + 1);
            }
            if (textColor && textColor !== '#FFFFFF' && textColor !== '#000000') {
              colorFrequency.set(textColor, (colorFrequency.get(textColor) || 0) + 1);
            }
          }
        }

        // Get most frequent colors (excluding white/black)
        const sortedColors = Array.from(colorFrequency.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([color]) => color);

        additionalColors.push(...sortedColors);

        return additionalColors.filter((color, index, arr) => arr.indexOf(color) === index); // Remove duplicates
      };

      const palette: { primary?: string; secondary?: string; accent?: string; text?: string; background?: string } = {};

      // FIRST: Check CSS variables and meta tags (HIGHEST PRIORITY)
      console.log('[Color Extraction] Checking CSS variables and meta tags first...');
      const cssVariableColors = fallbackColors();
      
      // Give CSS variable colors extremely high scores so they always win
      for (const color of cssVariableColors) {
        const existing = colorScores.find(cs => cs.color === color);
        if (existing) {
          // Boost existing score massively
          existing.score += 1000;
          console.log(`[Color Extraction] Boosted CSS variable color ${color} to score ${existing.score}`);
        } else {
          // Add new color with very high score
          const rgb = color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
          colorScores.push({ 
            color, 
            score: 1000, 
            r: rgb[0], 
            g: rgb[1], 
            b: rgb[2] 
          });
          console.log(`[Color Extraction] Added CSS variable color ${color} with score 1000`);
        }
      }

      // Re-sort after adding CSS variable colors
      colorScores.sort((a, b) => b.score - a.score);

      // Get top brand colors (CSS variables will now be at the top)
      let brandColors = getDistinctColors();

      // If we still don't have enough brand colors after CSS variables, use other strategies
      if (brandColors.length < 3) {
        console.log('[Color Extraction] Still need more colors, checking headings and frequency analysis...');
        const additionalColors = additionalColorStrategies();

        // Merge with existing brand colors
        const allColors = [...brandColors, ...additionalColors];
        const uniqueColors = allColors.filter((color, index, arr) => arr.indexOf(color) === index);

        // Re-score with additional colors
        brandColors = getDistinctColors(uniqueColors);
      }

      if (brandColors.length > 0) palette.primary = brandColors[0];
      if (brandColors.length > 1) palette.secondary = brandColors[1];
      if (brandColors.length > 2) palette.accent = brandColors[2];

      // Get text color (look for common text colors, exclude brand colors)
      const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
      const textColorMap = new Map<string, number>();

      for (const el of textElements.slice(0, 50)) {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const color = toHex(style.color);
          if (color) {
            textColorMap.set(color, (textColorMap.get(color) || 0) + 1);
          }
        }
      }

      const textColors = Array.from(textColorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .filter(color => !brandColors.includes(color));

      if (textColors.length > 0) palette.text = textColors[0];

      // Get background color (most common light background)
      const bgElements = Array.from(document.querySelectorAll('body, main, section, div[class*="container"]'));
      const bgColorMap = new Map<string, number>();

      for (const el of bgElements.slice(0, 20)) {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const color = toHex(style.backgroundColor);
          if (color) {
            const rgb = color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
            const brightness = getBrightness(rgb[0], rgb[1], rgb[2]);
            // Only consider light backgrounds
            if (brightness > 200) {
              bgColorMap.set(color, (bgColorMap.get(color) || 0) + 1);
            }
          }
        }
      }

      const bgColors = Array.from(bgColorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .filter(color => !brandColors.includes(color));

      if (bgColors.length > 0) palette.background = bgColors[0];

      // Final safeguard: If we have no primary color, try to find any reasonable color
      if (!palette.primary && colorScores.length > 0) {
        console.log('[Color Extraction] No primary color found, using best available color');
        // Get the highest scoring color that isn't black/white/gray
        const bestColor = colorScores.find(cs =>
          cs.score > 0 && // Positive score required
          cs.color !== '#FFFFFF' &&
          cs.color !== '#000000' &&
          !isBlackish(cs.r, cs.g, cs.b) &&
          !isWhitish(cs.r, cs.g, cs.b) &&
          isColorful(cs.r, cs.g, cs.b)
        );

        if (bestColor) {
          palette.primary = bestColor.color;
          console.log(`[Color Extraction] Using fallback primary color: ${bestColor.color} (score: ${bestColor.score})`);
        } else {
          console.warn('[Color Extraction] Could not find any suitable primary color!');
        }
      }

      console.log('[Color Extraction] Final palette:', palette);
      return palette;
    });
  } catch (error) {
    console.error('[Color Extraction Fallback] Error:', error);
    return {};
  }
}

/**
 * Handle ordering platforms that require a second "order" click (e.g., location selection tiles)
 */
async function handleOrderingPlatform(page: Page): Promise<boolean> {
  try {
    const result = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], input[type="submit"]'));
      const keywords = [
        'schedule order',
        'order now',
        'order here',       // Added for order.online platform
        'start order',
        'order online',
        'continue to menu',
        'view menu',
        'see menu',
        'browse menu',
        'continue',
        'next',
        'proceed'
      ];

      // Score buttons based on text match strength and position inside location cards
      let bestButton: { element: HTMLElement; score: number; text: string; details: Record<string, unknown> } | null = null;
      const inspectedButtons: Array<{ text: string; score: number; rect: { w: number; h: number; x: number; y: number }; keywordMatches: string[]; containerSnippet?: string }> = [];

      for (const btn of buttons) {
        const el = btn as HTMLElement;
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if ((btn as HTMLButtonElement).disabled) {
          inspectedButtons.push({
            text: (btn.textContent || '').trim(),
            score: 0,
            rect: { w: rect.width, h: rect.height, x: rect.left, y: rect.top },
            keywordMatches: [],
            containerSnippet: 'disabled'
          });
          continue;
        }

        const text = ((btn.textContent || btn.getAttribute('aria-label') || (btn as HTMLInputElement).value) || '').toLowerCase().trim();
        if (!text) continue;

        let score = 0;
        const matchedKeywords: string[] = [];
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            score += keyword.length * 2;
            matchedKeywords.push(keyword);
          }
        }

        if (score === 0) {
          inspectedButtons.push({
            text,
            score,
            rect: { w: rect.width, h: rect.height, x: rect.left, y: rect.top },
            keywordMatches: matchedKeywords
          });
          continue;
        }

        // Prefer buttons inside location cards/sections
        const locationContainer = el.closest('[class*="location"], [class*="store"], [class*="restaurant"], article, section, li, div[role="listitem"]');
        if (locationContainer) score += 40;

        // Bonus if the container mentions "open" or address-like patterns
        let containerSnippet: string | undefined;
        if (locationContainer) {
          const containerText = (locationContainer.textContent || '').toLowerCase();
          containerSnippet = containerText.slice(0, 160);
          if (containerText.includes('open')) score += 10;
          if (/\d{2,5}\s+[a-z]/i.test(containerText)) score += 15;
        }

        inspectedButtons.push({
          text,
          score,
          rect: { w: rect.width, h: rect.height, x: rect.left, y: rect.top },
          keywordMatches: matchedKeywords,
          containerSnippet
        });

        if (!bestButton || score > bestButton.score) {
          bestButton = { element: el, score, text, details: { rect: { w: rect.width, h: rect.height, x: rect.left, y: rect.top }, matchedKeywords, containerSnippet } };
        }
      }

      if (bestButton) {
        bestButton.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => bestButton.element.click(), 150);
        return { clicked: true, text: bestButton.text, score: bestButton.score, details: bestButton.details, inspected: inspectedButtons.slice(0, 12) };
      }

      return { clicked: false, inspected: inspectedButtons.slice(0, 12), total: buttons.length };
    });

    if (result?.clicked) {
      console.log(`[Ordering Platform] Clicked follow-up button: "${result.text}" (score: ${result.score})`);
      if (result.details) {
        console.log('[Ordering Platform] Button details:', result.details);
      }
      if (result.inspected) {
        console.log('[Ordering Platform] Top inspected candidates:', JSON.stringify(result.inspected, null, 2));
      }
      await delay(1000);
      return true;
    }

    console.log('[Ordering Platform] No button clicked. Inspect summary:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.warn('[Ordering Platform] Error while handling platform:', error);
  }

  return false;
}
