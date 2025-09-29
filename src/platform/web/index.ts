import type { DeviceAPIs } from '../device.types';

export const webDevice: DeviceAPIs = {
  push: {
    async isSupported() {
      return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
    },
    async requestPermission() {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
      const permission = await Notification.requestPermission();
      return permission === 'default' ? 'prompt' : permission;
    },
    async register(onMessage) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (e) => onMessage(e.data));
      }
    },
    async getToken() { return null; }, // Add VAPID later if needed
  },
  camera: {
    async pickImage() {
      if (typeof document === 'undefined') return null;
      return new Promise<Blob|null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file'; 
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });
    },
  },
  share: {
    async share(opts) {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as unknown as { share?: (opts: { title?: string; text?: string; url?: string }) => Promise<void> }).share?.(opts); 
        return true;
      }
      try { 
        if (opts.url && 'clipboard' in navigator) {
          await (navigator as unknown as { clipboard: { writeText: (text: string) => Promise<void> } }).clipboard.writeText(opts.url);
        }
        return false; 
      } catch { 
        return false; 
      }
    },
  },
  haptics: { 
    impact() {} 
  },
};
