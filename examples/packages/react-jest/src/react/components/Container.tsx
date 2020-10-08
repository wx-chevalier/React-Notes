import React, { Component } from 'react';
import { NewPost } from './posts/NewPost';
import { PostsList } from './posts/PostsList';

export class Container extends Component {
  state = {
    posts: [{ title: 'Hello', body: 'World' }]
  };

  addPost = (post: any) => {
    const { posts } = this.state;

    this.setState({
      posts: [...posts, post]
    });
  };

  deletePost = (postIndex: number) => {
    const { posts } = this.state;
    const updatedPosts = [...posts];
    updatedPosts.splice(postIndex, 1);
    this.setState({
      posts: updatedPosts
    });
  };

  render() {
    const { addPost } = this;
    const { posts } = this.state;
    return (
      <>
        <NewPost key="new-post" onPostCreated={addPost} />, posts.length > 0 ? (
        <PostsList key="posts-list" posts={posts} onPostDeleted={this.deletePost} />) : null
      </>
    );
  }
}
