'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type DomainType = 'diners' | 'restaurants';

interface DomainContextType {
  domain: DomainType;
  subdomain: string;
  isDinersApp: boolean;
  isRestaurantsApp: boolean;
}

const DomainContext = createContext<DomainContextType>({
  domain: 'diners', // Default to diners since main domain redirects
  subdomain: '',
  isDinersApp: true,
  isRestaurantsApp: false,
});

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [domain, setDomain] = useState<DomainType>('diners');
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const sub = hostname.split('.')[0];
      
      setSubdomain(sub);
      
      switch (sub) {
        case 'diners':
        case 'explore':
          setDomain('diners');
          break;
        case 'restaurants':
          setDomain('restaurants');
          break;
        default:
          // This shouldn't happen since middleware redirects main domain
          setDomain('diners');
      }
    }
  }, []);

  const isDinersApp = domain === 'diners';
  const isRestaurantsApp = domain === 'restaurants';

  return (
    <DomainContext.Provider value={{
      domain,
      subdomain,
      isDinersApp,
      isRestaurantsApp,
    }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  const context = useContext(DomainContext);
  if (!context) {
    throw new Error('useDomain must be used within DomainProvider');
  }
  return context;
}
