export interface PushAPI {
  isSupported(): Promise<boolean>;
  requestPermission(): Promise<'granted'|'denied'|'prompt'>;
  register(onMessage: (payload: unknown) => void): Promise<void>;
  getToken(): Promise<string|null>;
}

export interface CameraAPI { 
  pickImage(): Promise<File|Blob|null>; 
}

export interface ShareAPI { 
  share(opts: { title?: string; text?: string; url?: string }): Promise<boolean>; 
}

export interface HapticsAPI { 
  impact(style?: 'light'|'medium'|'heavy'): void; 
}

export interface DeviceAPIs { 
  push: PushAPI; 
  camera: CameraAPI; 
  share: ShareAPI; 
  haptics: HapticsAPI; 
}
