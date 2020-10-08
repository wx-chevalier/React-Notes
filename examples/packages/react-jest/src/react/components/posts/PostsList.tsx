import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Post } from './Post';

interface Props {
  posts: {
    title: string;
    body: string;
  }[];

  onPostDeleted?: Function;
}

export class PostsList extends Component<Props> {
  render() {
    const { posts, onPostDeleted } = this.props;
    const rows = posts.map(({ title, body }, index) => (
      <Post
        key={`${title}-${body}-${index}`}
        index={index}
        title={title}
        body={body}
        onPostDeleted={onPostDeleted}
      />
    ));

    return (
      <table>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}
