import {
  Button,
  Card,
  DatePicker,
  Form,
  Icon,
  Input,
  InputNumber,
  Radio,
  Select,
  Tooltip,
} from 'antd';
import { FormattedMessage, formatMessage } from 'umi-plugin-react/locale';
import React, { Component } from 'react';

import { Dispatch } from 'redux';
import { FormComponentProps } from 'antd/es/form';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { connect } from 'dva';
import styles from './style.less';

const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface BasicFormProps extends FormComponentProps {
  submitting: boolean;
  dispatch: Dispatch<any>;
}

class BasicForm extends Component<BasicFormProps> {
  handleSubmit = (e: React.FormEvent) => {
    const { dispatch, form } = this.props;
    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        dispatch({
          type: 'formBasicForm/submitRegularForm',
          payload: values,
        });
      }
    });
  };

  render() {
    const { submitting } = this.props;
    const {
      form: { getFieldDecorator, getFieldValue },
    } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };

    const submitFormLayout = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 10, offset: 7 },
      },
    };
    return (
      <PageHeaderWrapper content={<FormattedMessage id="form-basic-form.basic.description" />}>
        <Card bordered={false}>
          <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form-basic-form.title.label" />}>
              {getFieldDecorator('title', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'form-basic-form.title.required' }),
                  },
                ],
              })(<Input placeholder={formatMessage({ id: 'form-basic-form.title.placeholder' })} />)}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form-basic-form.date.label" />}>
              {getFieldDecorator('date', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'form-basic-form.date.required' }),
                  },
                ],
              })(
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={[
                    formatMessage({ id: 'form-basic-form.placeholder.start' }),
                    formatMessage({ id: 'form-basic-form.placeholder.end' }),
                  ]}
                />,
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form-basic-form.goal.label" />}>
              {getFieldDecorator('goal', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'form-basic-form.goal.required' }),
                  },
                ],
              })(
                <TextArea
                  style={{ minHeight: 32 }}
                  placeholder={formatMessage({ id: 'form-basic-form.goal.placeholder' })}
                  rows={4}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={<FormattedMessage id="form-basic-form.standard.label" />}
            >
              {getFieldDecorator('standard', {
                rules: [
                  {
                    required: true,
                    message: formatMessage({ id: 'form-basic-form.standard.required' }),
                  },
                ],
              })(
                <TextArea
                  style={{ minHeight: 32 }}
                  placeholder={formatMessage({ id: 'form-basic-form.standard.placeholder' })}
                  rows={4}
                />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  <FormattedMessage id="form-basic-form.client.label" />
                  <em className={styles.optional}>
                    <FormattedMessage id="form-basic-form.form.optional" />
                    <Tooltip title={<FormattedMessage id="form-basic-form.label.tooltip" />}>
                      <Icon type="info-circle-o" style={{ marginRight: 4 }} />
                    </Tooltip>
                  </em>
                </span>
              }
            >
              {getFieldDecorator('client')(
                <Input placeholder={formatMessage({ id: 'form-basic-form.client.placeholder' })} />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  <FormattedMessage id="form-basic-form.invites.label" />
                  <em className={styles.optional}>
                    <FormattedMessage id="form-basic-form.form.optional" />
                  </em>
                </span>
              }
            >
              {getFieldDecorator('invites')(
                <Input placeholder={formatMessage({ id: 'form-basic-form.invites.placeholder' })} />,
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  <FormattedMessage id="form-basic-form.weight.label" />
                  <em className={styles.optional}>
                    <FormattedMessage id="form-basic-form.form.optional" />
                  </em>
                </span>
              }
            >
              {getFieldDecorator('weight')(
                <InputNumber
                  placeholder={formatMessage({ id: 'form-basic-form.weight.placeholder' })}
                  min={0}
                  max={100}
                />,
              )}
              <span className="ant-form-text">%</span>
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={<FormattedMessage id="form-basic-form.public.label" />}
              help={<FormattedMessage id="form-basic-form.label.help" />}
            >
              <div>
                {getFieldDecorator('public', {
                  initialValue: '1',
                })(
                  <Radio.Group>
                    <Radio value="1">
                      <FormattedMessage id="form-basic-form.radio.public" />
                    </Radio>
                    <Radio value="2">
                      <FormattedMessage id="form-basic-form.radio.partially-public" />
                    </Radio>
                    <Radio value="3">
                      <FormattedMessage id="form-basic-form.radio.private" />
                    </Radio>
                  </Radio.Group>,
                )}
                <FormItem style={{ marginBottom: 0 }}>
                  {getFieldDecorator('publicUsers')(
                    <Select
                      mode="multiple"
                      placeholder={formatMessage({ id: 'form-basic-form.publicUsers.placeholder' })}
                      style={{
                        margin: '8px 0',
                        display: getFieldValue('public') === '2' ? 'block' : 'none',
                      }}
                    >
                      <Option value="1">
                        <FormattedMessage id="form-basic-form.option.A" />
                      </Option>
                      <Option value="2">
                        <FormattedMessage id="form-basic-form.option.B" />
                      </Option>
                      <Option value="3">
                        <FormattedMessage id="form-basic-form.option.C" />
                      </Option>
                    </Select>,
                  )}
                </FormItem>
              </div>
            </FormItem>
            <FormItem {...submitFormLayout} style={{ marginTop: 32 }}>
              <Button type="primary" htmlType="submit" loading={submitting}>
                <FormattedMessage id="form-basic-form.form.submit" />
              </Button>
              <Button style={{ marginLeft: 8 }}>
                <FormattedMessage id="form-basic-form.form.save" />
              </Button>
            </FormItem>
          </Form>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Form.create<BasicFormProps>()(
  connect(({ loading }: { loading: { effects: { [key: string]: boolean } } }) => ({
    submitting: loading.effects['formBasicForm/submitRegularForm'],
  }))(BasicForm),
);
