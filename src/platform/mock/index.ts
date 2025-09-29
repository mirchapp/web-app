import type { DeviceAPIs } from '../device.types';

export const mockDevice: DeviceAPIs = {
  push: { 
    async isSupported(){return false;}, 
    async requestPermission(){return 'prompt';}, 
    async register(){}, 
    async getToken(){return null;} 
  },
  camera: { 
    async pickImage(){return null;} 
  },
  share: { 
    async share(){return false;} 
  },
  haptics: { 
    impact(){} 
  },
};
