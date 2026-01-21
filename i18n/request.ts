// i18n.ts - Internationalization configuration

import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // French is the default locale
  const locale = 'fr';

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
