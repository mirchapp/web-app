import { webDevice } from './web';

let devicePromise: Promise<typeof webDevice> | null = null;

export function getDevice() {
  if (!devicePromise) {
    devicePromise = (async () => {
      // HARD GATE before importing anything native
      const isNative =
        typeof window !== 'undefined' &&
        ((window as unknown as { Capacitor?: unknown }).Capacitor || navigator.userAgent.includes('Capacitor'));

      if (isNative) {
        // Only now import the native loader
        const { loadNative } = await import('./native');
        return await loadNative();
      }
      return webDevice;
    })();
  }
  return devicePromise;
}
