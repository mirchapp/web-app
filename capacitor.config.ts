// Capacitor config - types will be available when @capacitor/cli is installed
const config = {
  appId: 'com.mirch.app',
  appName: 'Mirch',
  webDir: 'out',                 // fallback bundle if server.url unavailable
  server: { 
    url: 'https://app.mirch.app', 
    cleartext: false 
  }, // point to your deployed PWA
  android: { 
    allowMixedContent: false 
  },
  ios: { 
    contentInset: 'automatic' 
  },
};

export default config;
