import React from 'react';
import { shallow } from 'enzyme';

import { Container } from './Container';

describe('Container', () => {
  it('renders a default posts page', () => {
    const wrapper = shallow(<Container />);
    expect(wrapper).toMatchSnapshot();
  });

  describe('no posts provided', () => {
    const wrapper = shallow<Container>(<Container />);

    wrapper.setState({ posts: [] });

    expect(wrapper).toMatchSnapshot();
  });

  describe('#addPost', () => {
    it('adds post to top-level state', () => {
      const wrapper = shallow<Container>(<Container />);

      wrapper.instance().addPost({ title: 'New', body: 'Post' });
      expect(wrapper.state('posts')).toHaveLength(2);
    });
  });

  describe('#deletePost', () => {
    it('deletes post from top-level state', () => {
      const wrapper = shallow<Container>(<Container />);
      wrapper.instance().deletePost(0);
      expect(wrapper.state('posts')).toHaveLength(0);
    });
  });
});
