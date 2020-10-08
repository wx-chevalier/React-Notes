import zhMessages from './locales/zh.json.js.js';

let locale;

export function getDefaultLocale() {
  let i = window.navigator.userLanguage || window.navigator.language;
  if (i === 'en' || (i.startsWith && i.startsWith('en'))) {
    i = 'en';
  }
  if (i === 'zh' || (i.startsWith && i.startsWith('zh'))) {
    i = 'zh';
  }
  return i;
}

export function setLocale(_i) {
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

let intl;

export function setIntl(_intl) {
  _intl.messages = { ...zhMessages, ..._intl.messages };

  intl = _intl;
}

export default function i18nFormat(id, values) {
  if (!intl) {
    return 'Unknown';
  }

  return intl.formatMessage({ id, defaultMessage: zhMessages[id] }, values);
}
