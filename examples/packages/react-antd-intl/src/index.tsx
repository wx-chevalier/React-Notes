import { ConfigProvider } from 'antd';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IntlProvider, FormattedMessage,injectIntl } from 'react-intl';
import * as moment from 'moment';

import { i18nFormat, setLocale,setIntl } from '../i18n';

// 执行国际化操作
const { appLocale = { locale: 'zh' } } = window;

moment.locale(appLocale.moment);

setLocale(appLocale.locale);

class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      name: 'Eric',
      unreadCount: 1000
    };

    setIntl(props.intl)
  }

  render() {
    const { name, unreadCount } = this.state;

    return (
      <p>
        <FormattedMessage
          id="welcome"
          defaultMessage={`Hello {name}, you have {unreadCount, number} {unreadCount, plural,
                      one {message}
                      other {messages}
                    }`}
          values={{ name: <b>{name}</b>, unreadCount }}
        />
        
        <br/>

        {i18nFormat("test",{count:1000000})}
      </p>
    );
  }
}

const InjectedApp = injectIntl(App)

ReactDOM.render(
  <ConfigProvider locale={appLocale.antd}>
    <IntlProvider locale={appLocale.locale} messages={appLocale.messages}>
      <InjectedApp />
    </IntlProvider>
  </ConfigProvider>,
  document.getElementById('root')
);
