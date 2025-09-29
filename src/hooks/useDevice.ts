import { useEffect, useState } from 'react';
import type { DeviceAPIs } from '@/platform/device.types';
import { getDevice } from '@/platform/device';

export function useDevice() {
  const [device, setDevice] = useState<DeviceAPIs | null>(null);
  
  useEffect(() => { 
    let mounted = true; 
    getDevice().then((d) => { 
      if (mounted) setDevice(d); 
    }); 
    return () => { 
      mounted = false; 
    }; 
  }, []);
  
  return device;
}
