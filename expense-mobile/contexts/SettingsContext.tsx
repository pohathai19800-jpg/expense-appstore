import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { getDatabase, migrateDatabase } from '@/database';
import { getSettingValue, setSetting } from '@/database/table/settings/queries';
import { processDueBills } from '@/database/table/bills/queries';
import { defaultLanguage, languages } from '@/i18n/config';
import type { Language } from '@/i18n/config';
import { getTranslations, translations } from '@/i18n';

const LANGUAGE_SETTING_KEY = 'language';

type SettingsContextValue = {
  language: Language;
  t: (typeof translations)[Language];
  setLanguage: (language: Language) => Promise<void>;
  ready: boolean;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [ready, setReady] = useState(false);

  const initialize = useCallback(async () => {
    try {
      await getDatabase();
      await migrateDatabase();
      await processDueBills();

      const stored = await getSettingValue(LANGUAGE_SETTING_KEY);

      if (stored && stored in languages) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const setLanguage = useCallback(async (next: Language) => {
    setLanguageState(next);

    try {
      await setSetting(LANGUAGE_SETTING_KEY, next);
    } catch (error) {
      console.error('Failed to save language setting:', error);
    }
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      language,
      t: getTranslations(language),
      setLanguage,
      ready,
      reload: initialize,
    }),
    [language, setLanguage, ready, initialize]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}
