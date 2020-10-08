import * as React from "react";
import { connect } from "react-redux";
import { AppState } from "./store";

import "./main.css";

import { SystemState } from "./store/system/types";
import { updateSession } from "./store/system/actions";

import { ChatState } from "./store/chat/types";
import { sendMessage } from "./store/chat/actions";

import ChatHistory from "./ChatHistory";
import ChatInterface from "./ChatInterface";

import { thunkSendMessage } from "./thunks";

interface AppProps {
  sendMessage: typeof sendMessage;
  updateSession: typeof updateSession;
  chat: ChatState;
  system: SystemState;
  thunkSendMessage: any;
}

export type UpdateMessageParam = React.SyntheticEvent<{ value: string }>;

class App extends React.Component<AppProps> {
  state = {
    message: ""
  };

  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "myName"
    });
    this.props.sendMessage({
      user: "Chat Bot",
      message:
        "This is a very basic chat application written in typescript using react and redux. Feel free to explore the source code.",
      timestamp: new Date().getTime()
    });

    this.props.thunkSendMessage("This message was sent by a thunk!");
  }

  updateMessage = (event: UpdateMessageParam) => {
    this.setState({ message: event.currentTarget.value });
  };

  sendMessage = (message: string) => {
    this.props.sendMessage({
      user: this.props.system.userName,
      message: message,
      timestamp: new Date().getTime()
    });
    this.setState({ message: "" });
  };

  render() {
    return (
      <div className="parent">
        <ChatHistory messages={this.props.chat.messages} />
        <ChatInterface
          userName={this.props.system.userName}
          message={this.state.message}
          updateMessage={this.updateMessage}
          sendMessage={this.sendMessage}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  system: state.system,
  chat: state.chat
});

export default connect(
  mapStateToProps,
  { sendMessage, updateSession, thunkSendMessage }
)(App);
