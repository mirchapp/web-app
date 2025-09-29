'use client';

import React, { useState } from 'react';
import { useDevice } from '@/hooks/useDevice';

export default function DeviceDemo() {
  const device = useDevice(); 
  const [msg, setMsg] = useState('');

  if (!device) return <div>Loading device…</div>;

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-xl font-bold mb-4">Device API Demo</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={async () => { 
            const ok = await device.share.share({
              title: 'Mirch', 
              text: 'Check out Mirch', 
              url: location.href
            }); 
            setMsg(ok ? 'Shared!' : 'Copied link / fallback'); 
          }}
        >
          Share
        </button>
        
        <button 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={async () => { 
            const f = await device.camera.pickImage(); 
            setMsg(f ? `Picked ${Math.round((f.size/1024))} KB` : 'No image'); 
          }}
        >
          Pick Image
        </button>
        
        <button 
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          onClick={() => device.haptics.impact('light')}
        >
          Haptic
        </button>
        
        <button 
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onClick={async () => { 
            setMsg(`Push supported: ${await device.push.isSupported()}`); 
          }}
        >
          Check Push
        </button>
      </div>
      
      {msg && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          {msg}
        </div>
      )}
    </div>
  );
}
