import puppeteer, { Page, Browser } from 'puppeteer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      } catch (navError) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeout / 2 });
      }

      await delay(800); // Reduced from 2000ms

      // Wait for content (with shorter timeout)
      try {
        await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 3000 });
      } catch {
        // Continue anyway
      }

      // Execute scraping pipeline
      await dismissPopups(page);
      await navigateToMenu(page);
      await dismissPopups(page);
      await handleLocationBasedMenus(page);
      await expandSections(page);

      // Click through categories and collect all text
      const allContent = await clickThroughCategoriesAndExtract(page);

      // Extract logo and colors in parallel
      const [logo, colors] = await Promise.all([
        extractLogo(page),
        extractColorPalette(page)
      ]);

      console.log('[Scraper] Extracted', allContent.length, 'characters');
      console.log('[Scraper] Logo:', logo ? 'Yes' : 'No', '| Colors:', Object.keys(colors).length);

      await browser.close();

      // Validate content
      if (allContent.length < minContentLength) {
        console.warn(`[Scraper] Content too short: ${allContent.length} chars`);
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
        } catch (closeError) {
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
    const clicked = await page.evaluate(() => {
      const acceptKeywords = ['accept', 'allow', 'agree', 'continue', 'ok', 'got it', 'close', 'dismiss', 'no thanks', '×', 'x'];
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], [class*="modal"] button, [class*="popup"] button'));

      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase().trim();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0 || text.length > 60) continue;

        const inModal = btn.closest('[role="dialog"], [class*="modal"], [class*="popup"]');
        const isAcceptButton = acceptKeywords.some(kw => text.includes(kw) || ariaLabel.includes(kw));

        if (isAcceptButton && inModal) {
          (btn as HTMLElement).click();
          return true;
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
            return true;
          }
        }
      }

      return false;
    });

    if (clicked) {
      await delay(200);
    }
  } catch (error) {
    // Ignore popup errors
  }
}

/**
 * Navigate to menu page - OPTIMIZED
 */
async function navigateToMenu(page: Page): Promise<void> {
  try {
    const menuPageCheck = await page.evaluate(() => {
      const url = window.location.href.toLowerCase();
      const text = document.body.innerText.toLowerCase();

      const priceCount = (text.match(/\$\s?\d+\.?\d*/g) || []).length;
      const hasMenuUrl = url.includes('/menu') || url.includes('/merchant/');
      const menuKeywords = ['appetizer', 'entree', 'entrée', 'dessert', 'beverage', 'main course', 'sandwich', 'burger', 'pizza', 'salad', 'soup'];
      const menuKeywordMatches = menuKeywords.filter(kw => text.includes(kw)).length;
      const hasMenuContent = menuKeywordMatches >= 2 || priceCount > 12;
      const hasMenuGrid = !!document.querySelector('[id*="menu"], [class*="menu-items"], [class*="food-items"]');

      const signals = [hasMenuUrl, hasMenuContent, hasMenuGrid].filter(Boolean).length;
      return signals >= 2;
    });

    if (menuPageCheck) {
      console.log('[Scraper] Already on menu page');
      return;
    }

    // Try dropdown first
    const dropdownClicked = await handleDropdownMenu(page);
    if (dropdownClicked) {
      await delay(600);
      return;
    }

    // Look for menu button
    const buttonText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));

      for (const btn of buttons) {
        const text = (btn.textContent || '').trim();
        const textLower = text.toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();

        if (!text || text.length > 60 || rect.width === 0 || rect.height === 0) continue;
        if (textLower.includes('cart') || textLower.includes('checkout') || textLower.includes('account') || textLower.includes('login')) continue;

        if (textLower.includes('menu') || textLower === 'menu' || textLower.includes('view menu')) {
          return text;
        }
      }

      // Fallback to order button
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim();
        const textLower = text.toLowerCase();
        const rect = (btn as HTMLElement).getBoundingClientRect();

        if (!text || text.length > 60 || rect.width === 0 || rect.height === 0) continue;

        if (textLower.includes('order now') || textLower.includes('order online') || textLower.includes('start order')) {
          return text;
        }
      }

      return null;
    });

    if (!buttonText) {
      return;
    }

    const clicked = await page.evaluate((text) => {
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
    }, buttonText);

    if (clicked) {
      console.log('[Scraper] Clicked menu button');
      await delay(1000);

      try {
        await page.waitForSelector('[id*="menu"], [class*="menu-grid"], main', { timeout: 3000 });
      } catch {
        // Continue anyway
      }
    }
  } catch (error) {
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
          const links = Array.from(list.querySelectorAll('a'));
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
  } catch (error) {
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
      const priceCount = (text.match(/\$\d+\.?\d*/g) || []).length;
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
  } catch (error) {
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
      const maxExpand = 50; // Reduced from 200

      // Expand aria-expanded=false
      const expandables = Array.from(document.querySelectorAll('[aria-expanded="false"]'));
      for (const el of expandables) {
        if (count >= maxExpand) break;
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          try {
            (el as HTMLElement).click();
            count++;
            await new Promise(r => setTimeout(r, 10)); // Reduced from 30ms
          } catch {}
        }
      }

      // Open details elements
      const details = Array.from(document.querySelectorAll('details:not([open])')) as HTMLDetailsElement[];
      for (const d of details) {
        if (count >= maxExpand) break;
        try {
          d.open = true;
          count++;
        } catch {}
      }
    });

    await delay(150); // Reduced from 300ms
  } catch (error) {
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

    // Extract initial content
    await scrollForLazyContent(page);
    const initialText = await page.evaluate(() => document.body.innerText || '');
    allText += initialText;
    const initNorm = initialText.replace(/\s+/g, ' ');
    seenContent.add(initNorm.slice(0, 300) + '::' + initNorm.slice(-300));

    console.log('[Scraper] Initial content:', initialText.length, 'chars');

    // Detect categories
    const categories = await page.evaluate(() => {
      type Cat = { text: string; href: string; isNavLink: boolean };
      const out: Cat[] = [];
      const seenText = new Set<string>();

      // Strategy 1: Menu containers
      const menuContainers = Array.from(document.querySelectorAll(
        '[id*="menu-grid"], [class*="menu-grid"], [class*="menu-nav"], [class*="category"], [class*="MuiGrid-container"], section[class*="menu"], .menu-categories'
      ));

      if (menuContainers.length > 0) {
        for (const container of menuContainers) {
          const clickables = Array.from(container.querySelectorAll('a, button, [role="button"], [onclick], [class*="card"], [class*="item"]'));

          for (const el of clickables) {
            const text = (el.textContent || '').trim();
            const rect = (el as HTMLElement).getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) continue;
            if (text.length < 3 || text.length > 200) continue;
            if (seenText.has(text)) continue;

            // Skip concatenated text
            if (text.length > 100 && !text.includes(' ')) continue;

            if (rect.width >= 50 && rect.height >= 20) {
              const href = (el.getAttribute('href') || '').trim();
              const isNavLink = !!href && !href.startsWith('#') && !href.startsWith('javascript') && href !== '/';
              out.push({ text, href: href || '#', isNavLink });
              seenText.add(text);
            }
          }
        }
      }

      // Strategy 2: Fallback
      if (out.length < 3) {
        const allClickables = Array.from(document.querySelectorAll('a, button, [role="button"], [onclick]'));

        for (const el of allClickables) {
          const text = (el.textContent || '').trim();
          const rect = (el as HTMLElement).getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) continue;
          if (text.length < 3 || text.length > 200) continue;
          if (seenText.has(text)) continue;

          const inNav = el.closest('nav');
          const inFooter = el.closest('footer');
          if (inNav || inFooter) continue;

          const textLower = text.toLowerCase();
          if (textLower === 'skip to main content' || textLower === 'skip to content') continue;

          const isLargeCard = rect.width >= 150 && rect.height >= 100;
          const isWideLink = rect.width >= 200 && rect.height >= 30;
          const isMediumElement = rect.width >= 120 && rect.height >= 50;

          if (isLargeCard || isWideLink || isMediumElement) {
            const href = (el.getAttribute('href') || '').trim();
            const isNavLink = !!href && !href.startsWith('#') && !href.startsWith('javascript') && href !== '/';
            out.push({ text, href: href || '#', isNavLink });
            seenText.add(text);
          }
        }
      }

      return out.slice(0, 30); // Limit to 30 categories max
    });

    console.log('[Scraper] Found', categories.length, 'categories');

    const navLinks = categories.filter(c => c.isNavLink && c.href);
    const inPageTabs = categories.filter(c => !c.isNavLink);

    const menuBaseUrl = page.url();

    // Process in-page tabs
    for (let i = 0; i < inPageTabs.length; i++) {
      const category = inPageTabs[i];

      // Navigate back if needed
      const currentUrl = page.url();
      if (currentUrl !== menuBaseUrl) {
        try {
          await page.goto(menuBaseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await delay(400);
        } catch {
          continue;
        }
      }

      try {
        // Skip concatenated text
        if (category.text.length > 100) continue;

        const clicked = await page.evaluate((text) => {
          const normalizeText = (str: string) => {
            return str.toLowerCase().replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
          };

          const normalizedTarget = normalizeText(text);

          // Try multiple selector strategies - fast combined approach
          const selectors = [
            '[role="tab"]',
            'a[href^="#"]',
            'a, button, [role="button"]',
            '[onclick]',
            '[class*="card"], [class*="tile"], [class*="item"]',
            'div[class*="MuiGrid"], div[class*="category"]'
          ];

          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector));

            for (const el of elements) {
              const elText = (el.textContent || '').trim();
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
          const urlBeforeClick = currentUrl;
          await delay(300); // Reduced from 500ms
          const urlAfterClick = page.url();

          if (urlAfterClick !== urlBeforeClick) {
            await delay(800); // Navigation detected
          } else {
            await delay(200); // In-page change
          }

          await scrollForLazyContent(page);

          const categoryContent = await page.evaluate(() => {
            const scope = (document.querySelector('main, [role="main"], #main, .main, [class*="main"], [class*="content"]') as HTMLElement) || document.body;
            return scope.innerText || document.body.innerText || '';
          });

          const norm = categoryContent.replace(/\s+/g, ' ');
          const fingerprint = norm.slice(0, 250) + '::' + norm.slice(-250);

          if (!seenContent.has(fingerprint)) {
            console.log(`[Scraper] ✓ "${category.text}":`, categoryContent.length, 'chars');
            allText += '\n\n=== ' + category.text.toUpperCase() + ' ===\n\n' + categoryContent;
            seenContent.add(fingerprint);
          }
        }
      } catch (error) {
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
          console.log(`[Scraper] ✓ "${category.text}":`, categoryContent.length, 'chars');
          allText += '\n\n=== ' + category.text.toUpperCase() + ' ===\n\n' + categoryContent;
          seenContent.add(fingerprint);
        }
      } catch (navError) {
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
    await page.evaluate(async () => {
      // Fast window scrolling
      const scrollStep = window.innerHeight;
      let scrollAttempts = 0;
      const maxScrollAttempts = 5; // Reduced from 10

      while (scrollAttempts < maxScrollAttempts) {
        const currentPosition = window.scrollY;
        const targetPosition = Math.min(currentPosition + scrollStep, document.body.scrollHeight);

        window.scrollTo(0, targetPosition);
        await new Promise(r => setTimeout(r, 100)); // Reduced from 300ms

        if (targetPosition >= document.body.scrollHeight - window.innerHeight) {
          break;
        }

        scrollAttempts++;
      }

      // Scroll top 3 scrollable containers only
      const scrollables: HTMLElement[] = [];
      const allElements = Array.from(document.querySelectorAll('*'));

      for (const el of allElements) {
        const style = window.getComputedStyle(el as HTMLElement);
        const overflowY = style.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') &&
            (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 20) {
          scrollables.push(el as HTMLElement);
        }
      }

      scrollables.sort((a, b) => b.scrollHeight - a.scrollHeight);

      // Only scroll top 3 containers
      for (const container of scrollables.slice(0, 3)) {
        for (let i = 0; i < 5; i++) { // Reduced from 12
          const scrollAmount = Math.min(
            container.scrollTop + container.clientHeight,
            container.scrollHeight
          );
          container.scrollTop = scrollAmount;
          await new Promise(r => setTimeout(r, 50)); // Reduced from 150ms

          if (scrollAmount >= container.scrollHeight) break;
        }
      }

      // Reset scroll
      window.scrollTo(0, 0);
      scrollables.forEach(el => el.scrollTop = 0);
    });
  } catch (error) {
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

      const looksLikeLogo = (url: string): boolean => {
        const lower = url.toLowerCase();
        if (lower.includes('icon') && !lower.includes('logo')) return false;
        if (lower.includes('avatar') || lower.includes('placeholder') || lower.includes('background')) return false;
        return true;
      };

      type LogoCandidate = { url: string; score: number };
      const candidates: LogoCandidate[] = [];

      // Strategy 1: Logo elements
      const brandElements = Array.from(document.querySelectorAll('[class*="logo" i], [id*="logo" i], [aria-label*="logo" i], [class*="brand" i], [id*="brand" i]'));

      for (const el of brandElements) {
        const rect = (el as HTMLElement).getBoundingClientRect();

        const bgUrl = extractBgImageUrl(el);
        if (bgUrl && bgUrl.startsWith('http') && looksLikeLogo(bgUrl)) {
          candidates.push({ url: bgUrl, score: 1000 + (rect.top < 150 ? 100 : 0) });
        }

        const img = el.querySelector('img');
        if (img && img.src && img.src.startsWith('http') && looksLikeLogo(img.src)) {
          const imgRect = img.getBoundingClientRect();
          candidates.push({ url: img.src, score: 900 + (imgRect.top < 150 ? 100 : 0) });
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
          if (bgUrl && bgUrl.startsWith('http') && looksLikeLogo(bgUrl)) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            const isTopLeft = rect.left < 400 && rect.top < 150;
            const isReasonableSize = rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300;

            if (isReasonableSize) {
              candidates.push({ url: bgUrl, score: 700 + (isTopLeft ? 200 : 0) });
            }
          }
        }

        // Images in header
        const headerImages = Array.from(header.querySelectorAll('img'));
        for (const img of headerImages) {
          if (!img.src || !img.src.startsWith('http') || !looksLikeLogo(img.src)) continue;

          const rect = img.getBoundingClientRect();
          const isTopLeft = rect.left < 400 && rect.top < 150;
          const isReasonableSize = rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300;

          if (isReasonableSize) {
            candidates.push({ url: img.src, score: 600 + (isTopLeft ? 200 : 0) });
          }
        }
      }

      // Strategy 3: Any image with "logo" in src/alt
      const allImages = Array.from(document.querySelectorAll('img'));
      for (const img of allImages) {
        const src = img.src || '';
        const alt = (img.alt || '').toLowerCase();

        if ((alt.includes('logo') || src.toLowerCase().includes('logo')) && src.startsWith('http')) {
          const rect = img.getBoundingClientRect();
          if (rect.width >= 40 && rect.width <= 500 && rect.height >= 30 && rect.height <= 300) {
            candidates.push({ url: src, score: 500 });
          }
        }
      }

      // Favicon fallback
      const favicon = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
      if (favicon && favicon.href && favicon.href.startsWith('http')) {
        candidates.push({ url: favicon.href, score: 100 });
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].url;
      }

      return null;
    });

    return logo;
  } catch (error) {
    return null;
  }
}

/**
 * Extract color palette - OPTIMIZED
 */
async function extractColorPalette(page: Page): Promise<ColorPalette> {
  try {
    return await page.evaluate(() => {
      // Helper to check if color is colorful (not grayscale)
      const isColorful = (r: number, g: number, b: number): boolean => {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        // Color has at least 30 points difference between channels (not grayscale)
        return diff >= 30;
      };

      // Helper to get color brightness (0-255)
      const getBrightness = (r: number, g: number, b: number): number => {
        return (r * 299 + g * 587 + b * 114) / 1000;
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

          // Ignore very light colors (backgrounds)
          if (r > 245 && g > 245 && b > 245) return null;

          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
          return hex;
        }

        return null;
      };

      type ColorScore = { color: string; score: number; r: number; g: number; b: number };
      const colorScores: ColorScore[] = [];

      // Target high-value brand elements
      const brandSelectors = [
        'button',
        '.btn', '.button',
        '[class*="cta"]', '[class*="CTA"]',
        '[class*="primary"]', '[class*="Primary"]',
        'a[class*="button"]',
        '[role="button"]',
        'header button', 'nav button',
        'header a', 'nav a',
        '[class*="brand"]', '[class*="Brand"]',
        '[class*="logo"]', '[class*="Logo"]'
      ];

      const elements = Array.from(document.querySelectorAll(brandSelectors.join(', ')));

      for (const el of elements) {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();

          // Skip hidden elements
          if (rect.width === 0 || rect.height === 0) continue;

          const bgColor = toHex(style.backgroundColor);
          const textColor = toHex(style.color);
          const borderColor = toHex(style.borderColor);

          const colors = [bgColor, textColor, borderColor].filter(Boolean) as string[];

          for (const color of colors) {
            const rgb = color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
            const [r, g, b] = rgb;

            // Calculate score based on element importance and color properties
            let score = 0;

            // High priority elements - button backgrounds are the most important
            if (el.tagName === 'BUTTON' || el.classList.contains('btn') || el.classList.contains('button')) {
              if (color === bgColor) {
                // Button background color is highest priority
                score += 150;
              } else {
                score += 50;
              }
            }
            if (el.classList.contains('cta') || el.classList.contains('CTA')) {
              score += 60;
            }
            if (el.classList.contains('primary') || el.classList.contains('Primary')) {
              score += 55;
            }
            if (el.closest('header') || el.closest('nav')) {
              // Lower priority for nav elements (could be link colors)
              score += 10;
            }
            if (el.classList.toString().toLowerCase().includes('brand') || el.classList.toString().toLowerCase().includes('logo')) {
              score += 40;
            }

            // Penalty for links (often blue, not brand color)
            if (el.tagName === 'A') {
              score -= 20;
            }

            // Bonus for colorful (non-grayscale) colors - these are more likely brand colors
            if (isColorful(r, g, b)) {
              score += 40;
            }

            // Heavy penalty for black/white/gray (common but not brand colors)
            const brightness = getBrightness(r, g, b);
            if (brightness < 40) {
              // Very dark (near black) - heavy penalty
              score -= 100;
            } else if (brightness > 230) {
              // Very light (near white)
              score -= 50;
            } else if (brightness > 200) {
              // Light colors
              score -= 20;
            }

            // Heavy penalty for pure grayscale
            if (!isColorful(r, g, b)) {
              score -= 60;
            }

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

      // Get distinct colors (filter out similar colors)
      const getDistinctColors = (excludeColors: string[] = []): string[] => {
        const distinct: string[] = [];

        for (const cs of colorScores) {
          // Skip if excluded
          if (excludeColors.includes(cs.color)) continue;

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

          if (!tooSimilar && cs.score > 0) {
            distinct.push(cs.color);
          }

          if (distinct.length >= 5) break;
        }

        return distinct;
      };

      const palette: { primary?: string; secondary?: string; accent?: string; text?: string; background?: string } = {};

      // Get top brand colors
      const brandColors = getDistinctColors();
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

      return palette;
    });
  } catch (error) {
    return {};
  }
}
