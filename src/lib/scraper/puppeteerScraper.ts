import puppeteer, { Page } from 'puppeteer';

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

/**
 * Production-grade restaurant menu scraper
 * Handles: dropdowns, multi-location menus, lazy loading, popups, tabs
 * Optimized for speed and reliability
 */
export async function scrapeRestaurantMenuWithPuppeteer(url: string): Promise<WebsiteData | null> {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(20000);
    page.setDefaultTimeout(15000);

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(500);

    // Execute scraping pipeline
    await dismissPopups(page);
    await navigateToMenu(page);
    await dismissPopups(page);
    await handleLocationBasedMenus(page);
    await expandSections(page);

    // Click through categories and collect all text
    const allContent = await clickThroughCategoriesAndExtract(page);

    // Extract logo and colors
    const logo = await extractLogo(page);
    const colors = await extractColorPalette(page);

    console.log('[Scraper] Extracted', allContent.length, 'characters total');
    console.log('[Scraper] Logo found:', logo ? 'Yes' : 'No');
    console.log('[Scraper] Colors found:', Object.keys(colors).length);
    console.log('[Scraper] Current URL:', await page.url());
    console.log('[Scraper] Waiting 3 seconds before closing...');
    await delay(3000);

    await browser.close();

    return allContent.length >= 200
      ? { text: allContent, logo: logo || undefined, colors: Object.keys(colors).length > 0 ? colors : undefined }
      : null;
  } catch {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    return null;
  }
}

/**
 * Dismiss popups (cookies, age verification, modals)
 * 3-level fallback: Accept buttons → Close buttons → Remove overlays
 */
async function dismissPopups(page: Page): Promise<void> {
  try {
    for (let attempt = 0; attempt < 1; attempt++) {
      const clicked = await page.evaluate(() => {
        const acceptKeywords = [
          'accept', 'allow', 'agree', 'continue', 'ok', 'got it',
          'close', 'dismiss', 'no thanks', '×', 'x'
        ];

        // Find accept/dismiss buttons in modals
        const buttons = Array.from(document.querySelectorAll(
          'button, a, [role="button"], [class*="modal"] button, [class*="popup"] button'
        ));

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

        // Fallback: Close visible modals
        const modals = Array.from(document.querySelectorAll('[role="dialog"], [class*="modal"]'));
        for (const modal of modals) {
          const rect = (modal as HTMLElement).getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const closeBtn = modal.querySelector('button[aria-label*="close"], [class*="close"]');
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
              return true;
            }
          }
        }

        // Nuclear: Remove blocking overlays
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

      if (clicked) await delay(200);
    }
  } catch {}
}

/**
 * Navigate to menu page
 * Handles: dropdown menus, order flows, direct links
 */
async function navigateToMenu(page: Page): Promise<void> {
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const onMenuPage = await page.evaluate(() => {
        const url = window.location.href.toLowerCase();
        const text = document.body.innerText.toLowerCase();
        const priceCount = (text.match(/\$\d+\.?\d*/g) || []).length;
        return (url.includes('menu') || url.includes('order')) && priceCount > 15;
      });

      if (onMenuPage) return;

      // Try dropdown navigation first
      const dropdownClicked = await handleDropdownMenu(page);
      if (dropdownClicked) {
        await delay(1000);
        continue;
      }

      // Try direct button click
      const buttonText = await page.evaluate(() => {
        const priorities = [
          { keywords: ['menu', 'view menu', 'see menu', 'our menu'], score: 100 },
          { keywords: ['order now', 'order online', 'start order'], score: 80 },
          { keywords: ['pickup', 'takeout'], score: 70 },
        ];

        const skip = ['cart', 'checkout', 'account', 'login', 'delivery', 'about', 'contact'];
        const buttons = Array.from(document.querySelectorAll('a, button, [role="button"]'));
        let best: { text: string; score: number } | null = null;

        for (const btn of buttons) {
          const text = (btn.textContent || '').trim();
          const textLower = text.toLowerCase();
          const rect = (btn as HTMLElement).getBoundingClientRect();

          if (!text || text.length > 60 || rect.width === 0 || rect.height === 0) continue;
          if (skip.some(s => textLower.includes(s))) continue;

          for (const p of priorities) {
            if (p.keywords.some(k => textLower.includes(k))) {
              if (!best || p.score > best.score) {
                best = { text, score: p.score };
              }
            }
          }
        }

        return best?.text || null;
      });

      if (!buttonText) break;

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
        await delay(600);
      } else {
        break;
      }
    }
  } catch {}
}

/**
 * Handle dropdown menu navigation (e.g., Webflow dropdowns)
 */
async function handleDropdownMenu(page: Page): Promise<boolean> {
  try {
    const result = await page.evaluate(async () => {
      const dropdowns = Array.from(document.querySelectorAll(
        '[class*="dropdown"], [aria-haspopup="menu"], .w-dropdown'
      ));

      console.log('[Dropdown] Found', dropdowns.length, 'dropdowns');

      for (const dropdown of dropdowns) {
        const text = (dropdown.textContent || '').toLowerCase();
        if (!text.includes('menu')) continue;

        console.log('[Dropdown] Found menu dropdown');

        // Click toggle
        const toggle = dropdown.querySelector('[class*="toggle"], button, .w-dropdown-toggle');
        const toggleEl = (toggle || dropdown) as HTMLElement;
        toggleEl.click();
        console.log('[Dropdown] Clicked toggle');

        await new Promise(r => setTimeout(r, 400));

        // Find dropdown list using aria-controls or direct query
        let list = null;
        const controlsId = toggleEl.getAttribute('aria-controls');
        if (controlsId) {
          list = document.getElementById(controlsId);
          console.log('[Dropdown] Found list via aria-controls:', controlsId);
        }
        if (!list) {
          list = dropdown.querySelector('[class*="dropdown-list"], .w-dropdown-list');
          console.log('[Dropdown] Found list via query');
        }

        if (list) {
          const links = Array.from(list.querySelectorAll('a'));
          console.log('[Dropdown] Found', links.length, 'links in dropdown');

          for (const link of links) {
            const href = link.getAttribute('href') || '';
            const linkText = (link.textContent || '').toLowerCase().trim();
            console.log('[Dropdown] Link:', linkText, '→', href);

            if (href.includes('/menu') || linkText === 'regular' || linkText === 'menu') {
              console.log('[Dropdown] ✅ Clicking menu link');
              (link as HTMLElement).click();
              return true;
            }
          }
        }
      }

      return false;
    });

    if (result) {
      console.log('[Scraper] Dropdown clicked, waiting...');
      await delay(600);
    }
    return result;
  } catch {
    return false;
  }
}

/**
 * Handle multi-location restaurant menus
 * Only runs when URL contains '/menu'
 */
async function handleLocationBasedMenus(page: Page): Promise<void> {
  try {
    const analysis = await page.evaluate(() => {
      const url = window.location.href.toLowerCase();
      if (!url.includes('/menu')) return null;

      const text = document.body.innerText.toLowerCase();
      const priceCount = (text.match(/\$\d+\.?\d*/g) || []).length;
      if (priceCount >= 15) return null; // Already on menu with items

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

    if (!analysis) return;

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
    }, analysis);

    await delay(800);
  } catch {}
}

/**
 * Expand accordion/collapsible sections
 */
async function expandSections(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      let count = 0;
      const expandables = Array.from(document.querySelectorAll('[aria-expanded="false"]'));

      for (const el of expandables) {
        if (count >= 50) break;
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          (el as HTMLElement).click();
          count++;
          await new Promise(r => setTimeout(r, 50));
        }
      }
    });

    await delay(200);
  } catch {}
}

/**
 * Click through menu categories/tabs and extract text from each
 * Returns combined text from all categories
 */
async function clickThroughCategoriesAndExtract(page: Page): Promise<string> {
  try {
    let allText = '';
    const seenContent = new Set<string>();

    // First, extract current page content
    await scrollForLazyContent(page);
    const initialContent = await page.evaluate(() => document.body.innerText || '');
    allText += initialContent;
    seenContent.add(initialContent.substring(0, 500)); // Use first 500 chars as fingerprint

    console.log('[Scraper] Initial content:', initialContent.length, 'chars');

    // Find all categories
    const categories = await page.evaluate(() => {
      const categoryKeywords = [
        'appetizer', 'starter', 'entree', 'main', 'dessert', 'drink', 'beverage',
        'salad', 'soup', 'pasta', 'pizza', 'burger', 'sandwich', 'brunch',
        'breakfast', 'lunch', 'dinner', 'noodle', 'rice', 'curry', 'seafood',
        'wine', 'beer', 'cocktail', 'sushi', 'roll', 'menu'
      ];

      const blacklist = [
        /^\d+$/,
        /^\$\d+/,
        /^[\d\s\-\(\)]+$/,
        /^\d{1,2}:\d{2}/,
        /^(add|remove|cart|checkout|order now|reservation)$/i,
      ];

      const clickable = Array.from(document.querySelectorAll(
        '[role="tab"], button, a, [class*="tab"]:not([class*="table"]), [class*="category"], [class*="menu"]'
      ));

      const results: Array<{ text: string; score: number; href: string }> = [];
      const seen = new Set<string>();

      for (const el of clickable) {
        const text = (el.textContent || '').trim();
        const textLower = text.toLowerCase();
        const className = (el.className || '').toLowerCase();
        const href = el.getAttribute('href') || '';
        const rect = (el as HTMLElement).getBoundingClientRect();

        if (!text || text.length < 3 || text.length > 50 || seen.has(text)) continue;
        if (rect.width === 0 || rect.height === 0) continue;
        if (blacklist.some(p => p.test(text))) continue;

        if (textLower.includes('home') || textLower.includes('contact') ||
            textLower.includes('account') || textLower.includes('about us')) continue;

        let score = 0;
        if (categoryKeywords.some(kw => textLower === kw || textLower === kw + 's')) score += 150;
        else if (categoryKeywords.some(kw => textLower.includes(kw))) score += 100;
        if (el.getAttribute('role') === 'tab') score += 100;
        if (className.includes('category')) score += 80;
        if (className.includes('tab')) score += 60;
        if (href.startsWith('#')) score += 50;

        if (score >= 50) {
          results.push({ text, score, href });
          seen.add(text);
        }
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, 25).map(r => ({ text: r.text, href: r.href }));
    });

    console.log('[Scraper] Found', categories.length, 'categories to click');

    // Click through each category and extract text
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`[Scraper] Clicking category ${i + 1}/${categories.length}: "${category.text}"`);

      const clicked = await page.evaluate((text) => {
        const clickable = Array.from(document.querySelectorAll('a, button, [role="tab"]'));
        for (const el of clickable) {
          if ((el.textContent || '').trim() === text) {
            const rect = (el as HTMLElement).getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              (el as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      }, category.text);

      if (clicked) {
        await delay(500); // Wait for content to load

        // Scroll to load lazy content
        await scrollForLazyContent(page);

        // Extract content from this category
        const categoryContent = await page.evaluate(() => document.body.innerText || '');
        const fingerprint = categoryContent.substring(0, 500);

        // Only add if it's new content
        if (!seenContent.has(fingerprint)) {
          console.log(`[Scraper] New content from "${category.text}":`, categoryContent.length, 'chars');
          allText += '\n\n=== ' + category.text.toUpperCase() + ' ===\n\n' + categoryContent;
          seenContent.add(fingerprint);
        } else {
          console.log(`[Scraper] Duplicate content from "${category.text}", skipping`);
        }
      }
    }

    return allText;
  } catch (error) {
    console.log('[Scraper] Error in category extraction:', error);
    // Fallback: just return current page content
    await scrollForLazyContent(page);
    return await page.evaluate(() => document.body.innerText || '');
  }
}

/**
 * Aggressive scrolling to trigger lazy loading
 * Scrolls window + all scrollable containers
 */
async function scrollForLazyContent(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      // Window scrolling
      for (let i = 0; i < 3; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(r => setTimeout(r, 200));
      }

      // Find scrollable containers
      const scrollables: HTMLElement[] = [];
      const allElements = Array.from(document.querySelectorAll('*'));

      for (const el of allElements) {
        const style = window.getComputedStyle(el as HTMLElement);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight + 20) {
          scrollables.push(el as HTMLElement);
        }
      }

      scrollables.sort((a, b) => b.scrollHeight - a.scrollHeight);

      // Scroll each container
      for (const container of scrollables.slice(0, 10)) {
        let stable = 0;
        let lastHeight = container.scrollHeight;

        for (let i = 0; i < 8; i++) {
          container.scrollTop = container.scrollHeight - container.clientHeight;
          await new Promise(r => setTimeout(r, 100));

          if (container.scrollHeight === lastHeight) {
            stable++;
            if (stable >= 2) break;
          } else {
            stable = 0;
          }

          lastHeight = container.scrollHeight;
        }
      }

      // Reset scroll
      window.scrollTo(0, 0);
      scrollables.forEach(el => el.scrollTop = 0);
    });
  } catch {}
}

/**
 * Extract logo from website
 * Looks for logo in common locations and validates it
 */
async function extractLogo(page: Page): Promise<string | null> {
  try {
    const logo = await page.evaluate(() => {
      // Strategy 1: Look for images with "logo" in src, alt, class, or id
      const images = Array.from(document.querySelectorAll('img'));

      for (const img of images) {
        const src = img.src || '';
        const alt = (img.alt || '').toLowerCase();
        const className = (img.className || '').toLowerCase();
        const id = (img.id || '').toLowerCase();

        // Check if this looks like a logo
        const isLogo =
          alt.includes('logo') ||
          className.includes('logo') ||
          id.includes('logo') ||
          src.toLowerCase().includes('logo');

        if (isLogo && src && src.startsWith('http')) {
          // Validate it's not too small (likely actual logo, not icon)
          const rect = img.getBoundingClientRect();
          if (rect.width >= 60 || rect.height >= 60) {
            return src;
          }
        }
      }

      // Strategy 2: Look in header/nav for largest image
      const header = document.querySelector('header, nav, [class*="header"], [class*="nav"]');
      if (header) {
        const headerImages = Array.from(header.querySelectorAll('img'));
        let largestImg: HTMLImageElement | null = null;
        let largestArea = 0;

        for (const img of headerImages) {
          const rect = img.getBoundingClientRect();
          const area = rect.width * rect.height;
          if (area > largestArea && area >= 3600 && img.src && img.src.startsWith('http')) {
            largestArea = area;
            largestImg = img;
          }
        }

        if (largestImg) return largestImg.src;
      }

      // Strategy 3: Check for SVG logos
      const svgs = Array.from(document.querySelectorAll('svg'));
      for (const svg of svgs) {
        const className = (svg.className.baseVal || '').toLowerCase();
        const id = (svg.id || '').toLowerCase();

        if (className.includes('logo') || id.includes('logo')) {
          // Try to get parent link's href or convert SVG to data URL
          const parent = svg.closest('a');
          if (parent) {
            const img = svg.querySelector('image');
            if (img) {
              const href = img.getAttribute('href') || img.getAttribute('xlink:href');
              if (href && href.startsWith('http')) return href;
            }
          }
        }
      }

      return null;
    });

    return logo;
  } catch {
    return null;
  }
}

/**
 * Extract brand color palette from website
 * Returns labeled color palette with primary, secondary, accent, text, and background colors
 */
async function extractColorPalette(page: Page): Promise<ColorPalette> {
  try {
    return await page.evaluate(() => {
      const bgColorMap = new Map<string, number>();
      const textColorMap = new Map<string, number>();
      const brandColorMap = new Map<string, number>();

      // Helper to convert any color to hex
      function toHex(color: string): string | null {
        if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') return null;

        // Already hex
        if (color.startsWith('#')) {
          return color.length === 7 ? color.toUpperCase() : null;
        }

        // RGB/RGBA
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);

          // Ignore very light colors (likely backgrounds)
          if (r > 240 && g > 240 && b > 240) return null;
          // Ignore very dark colors close to black
          if (r < 15 && g < 15 && b < 15) return null;

          const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
          return hex;
        }

        return null;
      }

      // Collect colors from various sources
      const elements = Array.from(document.querySelectorAll('*'));

      for (const el of elements) {
        if (el instanceof HTMLElement) {
          const style = window.getComputedStyle(el);

          // Background colors
          const bgColor = toHex(style.backgroundColor);
          if (bgColor) {
            bgColorMap.set(bgColor, (bgColorMap.get(bgColor) || 0) + 1);
          }

          // Text colors
          const textColor = toHex(style.color);
          if (textColor) {
            textColorMap.set(textColor, (textColorMap.get(textColor) || 0) + 1);
          }

          // Check for brand/important elements (header, nav, buttons, links)
          const isBrandElement =
            el.tagName === 'HEADER' ||
            el.tagName === 'NAV' ||
            el.tagName === 'BUTTON' ||
            (el.tagName === 'A' && el.closest('header, nav')) ||
            el.classList.contains('header') ||
            el.classList.contains('nav') ||
            el.classList.contains('button') ||
            el.classList.contains('btn') ||
            el.classList.contains('brand') ||
            el.classList.contains('cta') ||
            el.classList.contains('primary');

          // Collect brand colors with extra weight
          if (isBrandElement) {
            if (bgColor) brandColorMap.set(bgColor, (brandColorMap.get(bgColor) || 0) + 10);
            if (textColor) brandColorMap.set(textColor, (brandColorMap.get(textColor) || 0) + 5);

            const borderColor = toHex(style.borderColor);
            if (borderColor) brandColorMap.set(borderColor, (brandColorMap.get(borderColor) || 0) + 3);
          }
        }
      }

      // Helper to get distinct colors
      function getDistinctColors(colorMap: Map<string, number>, excludeColors: string[] = []): string[] {
        return Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color)
          .filter(color => {
            // Exclude already selected colors
            if (excludeColors.includes(color)) return false;

            // Check if too similar to excluded colors
            const rgb1 = color.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));

            for (const excluded of excludeColors) {
              const rgb2 = excluded.match(/#(..)(..)(..)/)!.slice(1).map(x => parseInt(x, 16));
              const distance = Math.sqrt(
                Math.pow(rgb1[0] - rgb2[0], 2) +
                Math.pow(rgb1[1] - rgb2[1], 2) +
                Math.pow(rgb1[2] - rgb2[2], 2)
              );

              if (distance < 30) return false;
            }

            return true;
          });
      }

      // Build palette
      const palette: { primary?: string; secondary?: string; accent?: string; text?: string; background?: string } = {};

      // Primary: Most prominent brand color (from buttons, headers, nav)
      const brandColors = getDistinctColors(brandColorMap);
      if (brandColors.length > 0) {
        palette.primary = brandColors[0];
      }

      // Secondary: Second most prominent brand color
      if (brandColors.length > 1) {
        palette.secondary = brandColors[1];
      }

      // Accent: Third brand color or a contrasting color
      if (brandColors.length > 2) {
        palette.accent = brandColors[2];
      }

      // Text: Most common text color (excluding black/near-black already filtered)
      const textColors = getDistinctColors(textColorMap, [palette.primary, palette.secondary, palette.accent].filter(Boolean) as string[]);
      if (textColors.length > 0) {
        palette.text = textColors[0];
      }

      // Background: Most common background color
      const bgColors = getDistinctColors(bgColorMap, [palette.primary, palette.secondary, palette.accent].filter(Boolean) as string[]);
      if (bgColors.length > 0) {
        palette.background = bgColors[0];
      }

      return palette;
    });
  } catch {
    return {};
  }
}
