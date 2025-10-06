import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DomainProvider } from "@/components/DomainProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mirch - Food Discovery",
  description: "Discover amazing restaurants and food experiences near you",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mirch",
    startupImage: [
      {
        url: "/ios/1024.png",
        media: "(device-width: 1024px) and (device-height: 1024px)",
      },
      {
        url: "/ios/180.png",
        media: "(device-width: 375px) and (device-height: 812px)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/ios/16.png", sizes: "16x16", type: "image/png" },
      { url: "/ios/20.png", sizes: "20x20", type: "image/png" },
      { url: "/ios/29.png", sizes: "29x29", type: "image/png" },
      { url: "/ios/32.png", sizes: "32x32", type: "image/png" },
      { url: "/ios/40.png", sizes: "40x40", type: "image/png" },
      { url: "/ios/50.png", sizes: "50x50", type: "image/png" },
      { url: "/ios/57.png", sizes: "57x57", type: "image/png" },
      { url: "/ios/58.png", sizes: "58x58", type: "image/png" },
      { url: "/ios/60.png", sizes: "60x60", type: "image/png" },
      { url: "/ios/64.png", sizes: "64x64", type: "image/png" },
      { url: "/ios/72.png", sizes: "72x72", type: "image/png" },
      { url: "/ios/76.png", sizes: "76x76", type: "image/png" },
      { url: "/ios/80.png", sizes: "80x80", type: "image/png" },
      { url: "/ios/87.png", sizes: "87x87", type: "image/png" },
      { url: "/ios/100.png", sizes: "100x100", type: "image/png" },
      { url: "/ios/114.png", sizes: "114x114", type: "image/png" },
      { url: "/ios/120.png", sizes: "120x120", type: "image/png" },
      { url: "/ios/128.png", sizes: "128x128", type: "image/png" },
      { url: "/ios/144.png", sizes: "144x144", type: "image/png" },
      { url: "/ios/152.png", sizes: "152x152", type: "image/png" },
      { url: "/ios/167.png", sizes: "167x167", type: "image/png" },
      { url: "/ios/180.png", sizes: "180x180", type: "image/png" },
      { url: "/ios/192.png", sizes: "192x192", type: "image/png" },
      { url: "/ios/256.png", sizes: "256x256", type: "image/png" },
      { url: "/ios/512.png", sizes: "512x512", type: "image/png" },
      { url: "/ios/1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: [
      { url: "/ios/57.png", sizes: "57x57", type: "image/png" },
      { url: "/ios/60.png", sizes: "60x60", type: "image/png" },
      { url: "/ios/72.png", sizes: "72x72", type: "image/png" },
      { url: "/ios/76.png", sizes: "76x76", type: "image/png" },
      { url: "/ios/114.png", sizes: "114x114", type: "image/png" },
      { url: "/ios/120.png", sizes: "120x120", type: "image/png" },
      { url: "/ios/144.png", sizes: "144x144", type: "image/png" },
      { url: "/ios/152.png", sizes: "152x152", type: "image/png" },
      { url: "/ios/180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Mirch",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#100C14",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: 'var(--background)' }}>
      <head>
        <style>{`:root{--background:#FDFCFE;--foreground:#100C14}@media(prefers-color-scheme:dark){:root{--background:#100C14;--foreground:#FDFCFE}}`}</style>
        {/* Ensure Safari toolbars match site background at initial paint and after theme changes */}
        <meta name="theme-color" content="#FDFCFE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#100C14" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        <meta id="theme-color" name="theme-color" content="#FDFCFE" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const el = document.querySelector('meta#theme-color');
    const setThemeColor = () => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      const bg = styles.getPropertyValue('--background')?.trim();
      if (el && bg) el.setAttribute('content', bg);
    };
    // Initial set as soon as possible
    setThemeColor();
    // Update on theme class changes
    new MutationObserver(setThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    // Update on prefers-color-scheme change
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', setThemeColor);
  } catch {}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <DomainProvider>
            {children}
          </DomainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
