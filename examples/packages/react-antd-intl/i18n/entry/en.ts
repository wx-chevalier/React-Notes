import antdEn from 'antd/lib/locale-provider/en_US';

import * as enMessages from '../locales/en.json';

window.appLocale = {
  messages: {
    ...enMessages
  },
  locale: 'en',
  antd: antdEn,
  moment: 'en-US'
};
