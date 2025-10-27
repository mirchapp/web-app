import puppeteer, { Page } from 'puppeteer';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ColorPalette {
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  background?: string;
}

interface MenuData {
  text: string;
  images: string[];
  menuUrl?: string;
  logo?: string;
  colors?: ColorPalette;
}

/**
 * Production-grade Google Maps menu scraper
 * Extracts menu content and external menu URLs
 */
export async function scrapeGoogleMapsMenu(placeId: string): Promise<MenuData | null> {
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
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    await page.goto(googleMapsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);

    // Check for external menu link
    const menuUrl = await extractMenuLink(page);

    // Extract logo and colors from Google Maps business profile
    const logo = await extractGoogleMapsLogo(page);
    const colors = await extractGoogleMapsColors(page);

    // Try to find and click Menu tab
    const menuTabFound = await findAndClickMenuTab(page);

    if (!menuTabFound) {
      await browser.close();
      return menuUrl
        ? { text: '', images: [], menuUrl: menuUrl, logo: logo || undefined, colors: Object.keys(colors).length > 0 ? colors : undefined }
        : null;
    }

    await delay(500);

    // Get menu subtabs
    const subtabs = await getMenuSubtabs(page);
    let allMenuContent = '';

    if (subtabs.length === 0) {
      await scrollMenuSection(page);
      allMenuContent = await extractGoogleMapsMenuText(page);
    } else {
      for (let i = 0; i < subtabs.length; i++) {
        await page.evaluate((index) => {
          const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
          if (tablists.length >= 2) {
            const tabs = Array.from(tablists[1].querySelectorAll('[role="tab"]'));
            if (tabs[index]) {
              (tabs[index] as HTMLElement).click();
            }
          }
        }, i);

        await delay(300);
        await scrollMenuSection(page);

        const content = await extractGoogleMapsMenuText(page);
        allMenuContent += `\n\n=== ${subtabs[i].toUpperCase()} ===\n${content}`;
      }
    }

    await browser.close();

    return allMenuContent.length >= 100
      ? { text: allMenuContent, images: [], menuUrl: menuUrl || undefined, logo: logo || undefined, colors: Object.keys(colors).length > 0 ? colors : undefined }
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
 * Extract external menu URL from Google Maps
 */
async function extractMenuLink(page: Page): Promise<string | null> {
  const menuUrl = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a'));

    for (const link of allLinks) {
      const text = (link.textContent || '').toLowerCase().trim();
      const href = link.getAttribute('href') || '';
      const ariaLabel = link.getAttribute('aria-label') || '';

      if ((text.includes('menu') || text.includes('order') || ariaLabel.toLowerCase().includes('menu')) && href) {
        if (!href.includes('google.com/maps') && !href.startsWith('#')) {
          return href;
        }
      }
    }

    return null;
  });

  return menuUrl;
}

async function findAndClickMenuTab(page: Page): Promise<boolean> {
  const clicked = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]')).filter(tab => {
      const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));
      if (tablists.length > 0) {
        return tablists[0].contains(tab);
      }
      return true;
    });

    for (const tab of tabs) {
      const text = (tab.textContent || '').trim().toLowerCase();
      if (text === 'menu' || text.includes('menu')) {
        (tab as HTMLElement).click();
        return true;
      }
    }

    return false;
  });

  if (clicked) await delay(600);
  return clicked;
}

async function getMenuSubtabs(page: Page): Promise<string[]> {
  await delay(400);

  const subtabs = await page.evaluate(() => {
    const tablists = Array.from(document.querySelectorAll('[role="tablist"]'));

    if (tablists.length >= 2) {
      const tabs = Array.from(tablists[1].querySelectorAll('[role="tab"]'));
      return tabs.map(tab => (tab.textContent || '').trim()).filter(text => text.length > 0);
    }

    return [];
  });

  return subtabs;
}

async function scrollMenuSection(page: Page) {
  await page.evaluate(async () => {
    const scrollableSelectors = [
      '[role="main"]',
      '[class*="scrollable"]',
      '[style*="overflow"]',
    ];

    let scrollContainer: Element | null = null;

    for (const selector of scrollableSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const style = window.getComputedStyle(element);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollContainer = element;
          break;
        }
      }
    }

    if (scrollContainer) {
      let lastHeight = 0;
      let stableCount = 0;
      let attempts = 0;

      while (attempts < 5) {
        scrollContainer.scrollBy(0, 2000);
        await new Promise(resolve => setTimeout(resolve, 100));

        const currentHeight = scrollContainer.scrollTop;

        if (currentHeight === lastHeight) {
          stableCount++;
          if (stableCount >= 2) break;
        } else {
          stableCount = 0;
        }

        lastHeight = currentHeight;
        attempts++;
      }
    }
  });
}

async function extractGoogleMapsMenuText(page: Page): Promise<string> {
  const menuContent = await page.evaluate(() => {
    const menuSelectors = [
      '[role="main"]',
      '[class*="section"]',
      '[class*="content"]',
      '[aria-label*="menu" i]',
    ];

    let menuContainer: Element | null = null;

    for (const selector of menuSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.length > 200) {
        menuContainer = element;
        break;
      }
    }

    if (!menuContainer) {
      menuContainer = document.body;
    }

    let text = (menuContainer as HTMLElement).innerText || '';
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.trim();

    return text;
  });

  return menuContent;
}

/**
 * Extract logo from Google Maps business profile
 */
async function extractGoogleMapsLogo(page: Page): Promise<string | null> {
  try {
    const logo = await page.evaluate(() => {
      // Google Maps displays business logo/profile image
      // Look for the main business image in the header area
      const images = Array.from(document.querySelectorAll('img'));

      for (const img of images) {
        const src = img.src || '';
        const alt = (img.alt || '').toLowerCase();

        // Google Maps business profile images often have specific patterns
        // They're usually in googleusercontent.com domain
        if (src.includes('googleusercontent.com') || src.includes('gstatic.com')) {
          const rect = img.getBoundingClientRect();
          // Profile/logo images are usually larger (not tiny icons)
          if (rect.width >= 80 && rect.height >= 80 && rect.width <= 500 && rect.height <= 500) {
            // Avoid map tiles and UI elements
            if (!src.includes('/vt/') && !src.includes('maps_api_') && !alt.includes('map')) {
              return src;
            }
          }
        }
      }

      // Fallback: Look for largest image in the side panel
      const sidePanel = document.querySelector('[role="main"]');
      if (sidePanel) {
        const panelImages = Array.from(sidePanel.querySelectorAll('img'));
        let largestImg: HTMLImageElement | null = null;
        let largestArea = 0;

        for (const img of panelImages) {
          const rect = img.getBoundingClientRect();
          const area = rect.width * rect.height;
          const src = img.src || '';

          if (
            area > largestArea &&
            area >= 6400 && // At least 80x80
            area <= 250000 && // Max 500x500
            src.startsWith('http') &&
            !src.includes('/vt/') &&
            !src.includes('maps_api_')
          ) {
            largestArea = area;
            largestImg = img;
          }
        }

        if (largestImg) return largestImg.src;
      }

      return null;
    });

    return logo;
  } catch {
    return null;
  }
}

/**
 * Extract colors from Google Maps photos/images
 * Returns minimal palette since Google Maps has limited custom branding
 */
async function extractGoogleMapsColors(page: Page): Promise<ColorPalette> {
  try {
    const palette = await page.evaluate(() => {
      const bgColorMap = new Map<string, number>();
      const textColorMap = new Map<string, number>();

      function toHex(color: string): string | null {
        if (!color || color === 'transparent' || color === 'inherit') return null;

        if (color.startsWith('#')) {
          return color.length === 7 ? color.toUpperCase() : null;
        }

        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);

          if (r > 240 && g > 240 && b > 240) return null;
          if (r < 15 && g < 15 && b < 15) return null;

          return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
        }

        return null;
      }

      // Check side panel elements for any custom colors
      const sidePanel = document.querySelector('[role="main"]');
      if (sidePanel) {
        const elements = Array.from(sidePanel.querySelectorAll('*'));

        for (const el of elements) {
          if (el instanceof HTMLElement) {
            const style = window.getComputedStyle(el);

            const bgColor = toHex(style.backgroundColor);
            if (bgColor) bgColorMap.set(bgColor, (bgColorMap.get(bgColor) || 0) + 1);

            const textColor = toHex(style.color);
            if (textColor) textColorMap.set(textColor, (textColorMap.get(textColor) || 0) + 1);
          }
        }
      }

      const palette: { primary?: string; secondary?: string; accent?: string; text?: string; background?: string } = {};

      const bgColors = Array.from(bgColorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      const textColors = Array.from(textColorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      if (bgColors.length > 0) palette.primary = bgColors[0];
      if (textColors.length > 0) palette.text = textColors[0];
      if (bgColors.length > 1) palette.background = bgColors[1];

      return palette;
    });

    return palette;
  } catch {
    return {};
  }
}
