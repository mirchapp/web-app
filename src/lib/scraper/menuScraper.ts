import * as cheerio from "cheerio";

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('[Scraper] Failed to fetch:', response.status, response.statusText);

      // If blocked, try with minimal headers
      if (response.status === 403) {
        console.log('[Scraper] Retrying with minimal headers...');
        const retryResponse = await fetch(url, {
          headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
          }
        });

        if (retryResponse.ok) {
          return await retryResponse.text();
        }
      }

      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('[Scraper] Fetch error:', error);
    return null;
  }
}

function findMenuLink($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Common menu link patterns
  const menuKeywords = ['menu', 'order', 'food', 'our-menu', 'ourmenu', 'online-order'];

  // Look for links containing menu keywords
  const links = $('a');

  for (let i = 0; i < links.length; i++) {
    const link = $(links[i]);
    const href = link.attr('href');
    const text = link.text().toLowerCase();

    if (!href) continue;

    // Check if link text or href contains menu keywords
    const hasMenuKeyword = menuKeywords.some(keyword =>
      text.includes(keyword) || href.toLowerCase().includes(keyword)
    );

    if (hasMenuKeyword) {
      // Convert relative URLs to absolute
      let menuUrl = href;

      if (href.startsWith('/')) {
        const base = new URL(baseUrl);
        menuUrl = `${base.origin}${href}`;
      } else if (!href.startsWith('http')) {
        menuUrl = new URL(href, baseUrl).href;
      }

      console.log('[Scraper] Found menu link:', menuUrl);
      return menuUrl;
    }
  }

  return null;
}

export async function scrapeWebsiteContent(url: string): Promise<string | null> {
  try {
    console.log('[Scraper] Fetching website:', url);

    const html = await fetchPage(url);
    if (!html) return null;

    let $ = cheerio.load(html);

    // Try to find a menu-specific page
    const menuLink = findMenuLink($, url);

    if (menuLink && menuLink !== url) {
      console.log('[Scraper] Following menu link:', menuLink);
      const menuHtml = await fetchPage(menuLink);
      if (menuHtml) {
        $ = cheerio.load(menuHtml);
        console.log('[Scraper] Successfully loaded menu page');
      }
    }

    // Remove script tags, style tags, and other noise
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('svg').remove();

    // Try to find menu-related content
    // Look for common menu identifiers
    const menuSelectors = [
      '[class*="menu"]',
      '[id*="menu"]',
      '[class*="food"]',
      '[id*="food"]',
      '[class*="dish"]',
      '[class*="item"]',
      'main',
      'article'
    ];

    let menuContent = '';

    for (const selector of menuSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 50) { // Only include substantial content
            menuContent += text + '\n\n';
          }
        });
      }
    }

    // Fallback: get all text content if no menu-specific content found
    if (!menuContent || menuContent.length < 100) {
      menuContent = $('body').text();
    }

    // Clean up whitespace
    menuContent = menuContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    console.log('[Scraper] Scraped content length:', menuContent.length);

    // Limit content size to reduce tokens and improve speed
    // 2500 characters ≈ 625 tokens, much faster processing
    if (menuContent.length > 2500) {
      menuContent = menuContent.substring(0, 2500);
    }

    return menuContent;
  } catch (error) {
    console.error('[Scraper] Error:', error);
    return null;
  }
}
