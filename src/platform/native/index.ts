import type { DeviceAPIs } from '../device.types';

// Build module names at runtime so bundlers can't statically include them
const dyn = async (name: string) => {
  // Use Function so the bundler can't statically analyze the import target
  const dynImport = new Function('s', 'return import(/** webpackIgnore: true **/ s)') as (s: string) => Promise<unknown>;
  return dynImport(name);
};

export const loadNative = async (): Promise<DeviceAPIs> => {
  // Defensive: ensure we're truly on native
  const capGlobal = (typeof window !== 'undefined' && (window as unknown as { Capacitor?: unknown }).Capacitor)
    ? (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor
    : null;
  if (!capGlobal) {
    throw new Error('Not on native platform');
  }

  // Build names in parts so bundlers cannot see '@capacitor/...'
  const join = (a: string, b: string, c: string) => [a, b, c].join('');
  const c1 = '@cap';
  const c2 = 'acitor';
  const coreMod = await dyn(join(c1, c2, '/core'));
  const pushMod = await dyn(join(c1, c2, '/push-notifications'));
  const camMod  = await dyn(join(c1, c2, '/camera'));
  const shareMod= await dyn(join(c1, c2, '/share'));
  const hapMod  = await dyn(join(c1, c2, '/haptics'));

  type CapacitorType = { isNativePlatform: () => boolean };
  type PushNotificationsType = {
    requestPermissions: () => Promise<{ receive: 'granted' | 'denied' | string }>;
    register: () => Promise<void>;
    addListener: (eventName: 'pushNotificationReceived', cb: (n: unknown) => void) => void;
  };
  type CameraType = {
    getPhoto: (opts: { resultType: 'dataUrl'; quality: number; allowEditing: boolean }) => Promise<{ dataUrl?: string }>;
  };
  type ShareType = { share: (opts: { title?: string; text?: string; url?: string }) => Promise<void> };
  type HapticsType = { impact: (opts: { style: 'LIGHT' | 'MEDIUM' | 'HEAVY' }) => void };

  const { Capacitor } = coreMod as { Capacitor: CapacitorType };
  const { PushNotifications } = pushMod as { PushNotifications: PushNotificationsType };
  const { Camera } = camMod as { Camera: CameraType };
  const { Share } = shareMod as { Share: ShareType };
  const { Haptics } = hapMod as { Haptics: HapticsType };

  return {
    push: {
      async isSupported() { return Capacitor.isNativePlatform(); },
      async requestPermission() {
        const perm = await PushNotifications.requestPermissions();
        return perm.receive === 'granted' ? 'granted' : 'denied';
      },
      async register(onMessage) {
        await PushNotifications.register();
        PushNotifications.addListener('pushNotificationReceived', (n: unknown) => onMessage(n));
      },
      async getToken() { return null; }, // handle via reg events or FCM plugin later
    },
    camera: {
      async pickImage() {
        const photo = await Camera.getPhoto({ 
          resultType: 'dataUrl', 
          quality: 80, 
          allowEditing: false 
        });
        if (!photo?.dataUrl) return null;
        const [meta, b64] = photo.dataUrl.split(',');
        const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? 'image/jpeg';
        const bin = atob(b64); 
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: mime });
      },
    },
    share: { 
      async share(opts) { 
        await Share.share(opts); 
        return true; 
      } 
    },
    haptics: { 
      impact(style = 'light') { 
        Haptics.impact({ style: style.toUpperCase() as 'LIGHT' | 'MEDIUM' | 'HEAVY' }); 
      } 
    },
  };
};
