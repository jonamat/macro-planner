import en from './en.json';
import it from './it.json';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { setDefaultOptions } from 'date-fns';
import { it as date_it } from 'date-fns/locale';

setDefaultOptions({ locale: date_it });

export const i18n = () => {
  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      // lng: 'it',

      resources: {
        en: {
          translation: en,
        },
        it: {
          translation: it,
        },
      },

      detection: {
        order: ['navigator', 'querystring', 'localStorage'], // change the order when will have a language switcher
        lookupQuerystring: 'lng',
      },

      returnNull: false,

      fallbackLng: 'en',
      missingKeyNoValueFallbackToKey: true,
      returnEmptyString: false,

      keySeparator: '\\s\\',
      nsSeparator: '\\ns\\',

      interpolation: {
        escapeValue: false,
      },
    });
};

export default i18n;
