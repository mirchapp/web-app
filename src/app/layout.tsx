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
      // iPhone landscape
      { url: "/splash_screens/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_landscape.png", media: "screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_landscape.png", media: "screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png", media: "screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_Air_landscape.png", media: "screen and (device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png", media: "screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png", media: "screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png", media: "screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png", media: "screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png", media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_11__iPhone_XR_landscape.png", media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png", media: "screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_landscape.png", media: "screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_landscape.png", media: "screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      // iPad landscape
      { url: "/splash_screens/splash_screens/13__iPad_Pro_M4_landscape.png", media: "screen and (device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/12.9__iPad_Pro_landscape.png", media: "screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/11__iPad_Pro_M4_landscape.png", media: "screen and (device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/11__iPad_Pro__10.5__iPad_Pro_landscape.png", media: "screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/10.9__iPad_Air_landscape.png", media: "screen and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/10.5__iPad_Air_landscape.png", media: "screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/10.2__iPad_landscape.png", media: "screen and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_landscape.png", media: "screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      { url: "/splash_screens/splash_screens/8.3__iPad_Mini_landscape.png", media: "screen and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" },
      // iPhone portrait
      { url: "/splash_screens/splash_screens/iPhone_17_Pro_Max__iPhone_16_Pro_Max_portrait.png", media: "screen and (device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_17_Pro__iPhone_17__iPhone_16_Pro_portrait.png", media: "screen and (device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png", media: "screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_Air_portrait.png", media: "screen and (device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png", media: "screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png", media: "screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png", media: "screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png", media: "screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png", media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_11__iPhone_XR_portrait.png", media: "screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png", media: "screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE_portrait.png", media: "screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/4__iPhone_SE__iPod_touch_5th_generation_and_later_portrait.png", media: "screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      // iPad portrait
      { url: "/splash_screens/splash_screens/13__iPad_Pro_M4_portrait.png", media: "screen and (device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/12.9__iPad_Pro_portrait.png", media: "screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/11__iPad_Pro_M4_portrait.png", media: "screen and (device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/11__iPad_Pro__10.5__iPad_Pro_portrait.png", media: "screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/10.9__iPad_Air_portrait.png", media: "screen and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/10.5__iPad_Air_portrait.png", media: "screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/10.2__iPad_portrait.png", media: "screen and (device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad_portrait.png", media: "screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
      { url: "/splash_screens/splash_screens/8.3__iPad_Mini_portrait.png", media: "screen and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" },
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
