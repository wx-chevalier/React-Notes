import React, { Component } from 'react';

export interface Props {
  onPostCreated: Function;
}

export class NewPost extends Component<Props> {
  state = {
    title: '',
    body: '',
    errorMessage: ''
  };

  onPostSaved = () => {
    const { title, body } = this.state;

    if (title.length === 0) {
      return this.setState({
        errorMessage: 'Title not provided'
      });
    }

    if (body.length === 0) {
      return this.setState({
        errorMessage: 'Body not provided'
      });
    }

    this.props.onPostCreated({ title, body });
    this.setState({
      title: '',
      body: '',
      errorMessage: ''
    });
  };

  onPostValueChanged = (key: any) => (event: { target: { value: any } }) =>
    this.setState({ [key]: event.target.value });

  render() {
    const { title, body, errorMessage } = this.state;
    return (
      <table>
        <tbody>
          <tr>
            <td>
              <input type="text" value={title} onChange={this.onPostValueChanged('title')} />
            </td>
            <td>
              <input type="text" value={body} onChange={this.onPostValueChanged('body')} />
            </td>
            <td>
              <button onClick={this.onPostSaved}>Create Post</button>
            </td>
          </tr>
          {errorMessage.length === 0 ? null : (
            <tr>
              <td>{errorMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
}
