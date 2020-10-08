import antdZh from 'antd/lib/locale-provider/zh_CN';

import * as zhMessages from '../locales/zh.json';

window.appLocale = {
  messages: {
    ...zhMessages
  },
  locale: 'zh',
  antd: antdZh,
  moment: 'zh-CN'
};
