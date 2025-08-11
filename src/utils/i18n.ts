import { ConfigService, Language } from '@config/env.config';
import { ROOT_DIR } from '@config/path.config';
import fs from 'fs';
import i18next from 'i18next';
import path from 'path';

const languages = ['en', 'pt-BR', 'es'];

// Resolve caminho de traduções tanto no build (dist) quanto no dev (src)
const distTranslationsPath = path.join(ROOT_DIR, 'dist', 'translations');
const srcTranslationsPath = path.join(ROOT_DIR, 'src', 'utils', 'translations');
const translationsPath = fs.existsSync(distTranslationsPath) ? distTranslationsPath : srcTranslationsPath;
const configService: ConfigService = new ConfigService();

const resources: any = {};

languages.forEach((language) => {
  const languagePath = path.join(translationsPath, `${language}.json`);
  if (fs.existsSync(languagePath)) {
    const fileContents = fs.readFileSync(languagePath, 'utf8');
    resources[language] = {
      translation: JSON.parse(fileContents),
    };
  }
});

i18next.init({
  resources,
  fallbackLng: 'en',
  lng: configService.get<Language>('LANGUAGE'),
  debug: false,

  interpolation: {
    escapeValue: false,
  },
});
export default i18next;
