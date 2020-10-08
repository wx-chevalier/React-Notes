import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Component, Fragment } from 'react';

import { List } from 'antd';

type Unpacked<T> = T extends (infer U)[] ? U : T;

const passwordStrength = {
  strong: (
    <span className="strong">
      <FormattedMessage id="account-settings.security.strong" defaultMessage="Strong" />
    </span>
  ),
  medium: (
    <span className="medium">
      <FormattedMessage id="account-settings.security.medium" defaultMessage="Medium" />
    </span>
  ),
  weak: (
    <span className="weak">
      <FormattedMessage id="account-settings.security.weak" defaultMessage="Weak" />
      Weak
    </span>
  ),
};

class SecurityView extends Component {
  getData = () => [
    {
      title: formatMessage({ id: 'account-settings.security.password' }, {}),
      description: (
        <Fragment>
          {formatMessage({ id: 'account-settings.security.password-description' })}：
          {passwordStrength.strong}
        </Fragment>
      ),
      actions: [
        <a key="Modify">
          <FormattedMessage id="account-settings.security.modify" defaultMessage="Modify" />
        </a>,
      ],
    },
    {
      title: formatMessage({ id: 'account-settings.security.phone' }, {}),
      description: `${formatMessage(
        { id: 'account-settings.security.phone-description' },
        {},
      )}：138****8293`,
      actions: [
        <a key="Modify">
          <FormattedMessage id="account-settings.security.modify" defaultMessage="Modify" />
        </a>,
      ],
    },
    {
      title: formatMessage({ id: 'account-settings.security.question' }, {}),
      description: formatMessage({ id: 'account-settings.security.question-description' }, {}),
      actions: [
        <a key="Set">
          <FormattedMessage id="account-settings.security.set" defaultMessage="Set" />
        </a>,
      ],
    },
    {
      title: formatMessage({ id: 'account-settings.security.email' }, {}),
      description: `${formatMessage(
        { id: 'account-settings.security.email-description' },
        {},
      )}：ant***sign.com`,
      actions: [
        <a key="Modify">
          <FormattedMessage id="account-settings.security.modify" defaultMessage="Modify" />
        </a>,
      ],
    },
    {
      title: formatMessage({ id: 'account-settings.security.mfa' }, {}),
      description: formatMessage({ id: 'account-settings.security.mfa-description' }, {}),
      actions: [
        <a key="bind">
          <FormattedMessage id="account-settings.security.bind" defaultMessage="Bind" />
        </a>,
      ],
    },
  ];

  render() {
    const data = this.getData();
    return (
      <Fragment>
        <List<Unpacked<typeof data>>
          itemLayout="horizontal"
          dataSource={data}
          renderItem={item => (
            <List.Item actions={item.actions}>
              <List.Item.Meta title={item.title} description={item.description} />
            </List.Item>
          )}
        />
      </Fragment>
    );
  }
}

export default SecurityView;
