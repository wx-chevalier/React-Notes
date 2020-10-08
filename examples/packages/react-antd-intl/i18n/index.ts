import * as zhMessages from './locales/zh.json';

declare global {
  interface Window {
    appLocale?: any;
  }
}

let locale: string;

export function getDefaultLocale() {
  let i = window.navigator.language;

  if (i === 'en' || (i.startsWith && i.startsWith('en'))) {
    i = 'en';
  }
  if (i === 'zh' || (i.startsWith && i.startsWith('zh'))) {
    i = 'zh';
  }
  return i;
}

export function setLocale(_i: string) {
  let i = _i;

  if (!i) {
    i = localStorage.getItem('xf_lang') || getDefaultLocale();
  }

  localStorage.setItem('xf_lang', i);

  locale = i;
}

export function getLocale() {
  if (!locale) {
    // en/en, zh/zh
    return localStorage.getItem('xf_lang') || getDefaultLocale();
  }
  return locale;
}

let intl: any;

export function setIntl(_intl: any) {
  _intl.messages = { ...zhMessages, ..._intl.messages };

  intl = _intl;
}

export function i18nFormat(id: string, values?: Record<string, any>) {
  if (!intl) {
    return 'Unknown';
  }

  return intl.formatMessage({ id, defaultMessage: zhMessages[id] }, values);
}
