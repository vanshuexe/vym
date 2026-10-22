import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEFAULT_ACADEMY, normalizeAcademy, type AcademyConfig } from '../data/academyCatalog';

interface CMSContextType {
  db: any;
  loading: boolean;
}

const CMSContext = createContext<CMSContextType>({ db: null, loading: true });

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms/data')
      .then(res => res.json())
      .then(data => {
        setDb(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load CMS data', err);
        setLoading(false);
      });
  }, []);

  return (
    <CMSContext.Provider value={{ db, loading }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  return useContext(CMSContext);
}

// The editable enrolment page config (programmes, prices, GST, text), or the built-in defaults until an admin saves one.
export function useAcademy(): AcademyConfig {
  const { db } = useCMS();
  return useMemo(() => normalizeAcademy(db?.academy) ?? DEFAULT_ACADEMY, [db]);
}
