import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from './en.json';
import zhHans from './zh-Hans.json';
import ja from './ja.json';
import ko from './ko.json';
import de from './de.json';
import fr from './fr.json';
import es from './es.json';
import ptBR from './pt-BR.json';
import ar from './ar.json';
import ru from './ru.json';
import it from './it.json';
import nl from './nl.json';
import tr from './tr.json';
import th from './th.json';
import vi from './vi.json';
import id from './id.json';
import pl from './pl.json';
import uk from './uk.json';
import hi from './hi.json';
import he from './he.json';
import sv from './sv.json';
import no from './no.json';
import da from './da.json';
import fi from './fi.json';
import cs from './cs.json';
import hu from './hu.json';
import ro from './ro.json';
import el from './el.json';
import ms from './ms.json';
import fil from './fil.json';

const resources = {
  en: { translation: en },
  'zh-Hans': { translation: zhHans },
  ja: { translation: ja },
  ko: { translation: ko },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  'pt-BR': { translation: ptBR },
  ar: { translation: ar },
  ru: { translation: ru },
  it: { translation: it },
  nl: { translation: nl },
  tr: { translation: tr },
  th: { translation: th },
  vi: { translation: vi },
  id: { translation: id },
  pl: { translation: pl },
  uk: { translation: uk },
  hi: { translation: hi },
  he: { translation: he },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  cs: { translation: cs },
  hu: { translation: hu },
  ro: { translation: ro },
  el: { translation: el },
  ms: { translation: ms },
  fil: { translation: fil },
};

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    const locales = RNLocalize.getLocales();
    const bestLanguage = locales[0]?.languageTag || 'en';

    // Map language tags to our supported languages
    const languageMap: Record<string, string> = {
      'zh-Hans': 'zh-Hans',
      'zh-CN': 'zh-Hans',
      'zh-SG': 'zh-Hans',
      'pt-BR': 'pt-BR',
      pt: 'pt-BR',
    };

    const baseLanguage = bestLanguage.split('-')[0];
    const mappedLanguage =
      languageMap[bestLanguage] || languageMap[baseLanguage] || baseLanguage;

    // Check if we support this language
    const supportedLanguage = resources[
      mappedLanguage as keyof typeof resources
    ]
      ? mappedLanguage
      : 'en';

    callback(supportedLanguage);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

export const isRTL = () => {
  const currentLang = i18n.language;
  return currentLang === 'ar' || currentLang === 'he';
};
