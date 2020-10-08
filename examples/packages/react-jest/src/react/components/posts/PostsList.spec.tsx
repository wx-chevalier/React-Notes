import React from 'react';
import { shallow } from 'enzyme';

import { PostsList } from './PostsList';

describe('PostsList', () => {
  it('correctly renders posts in order received', () => {
    const posts = [{ title: 'Test 1', body: 'Body 1' }, { title: 'Test 2', body: 'Body 2' }];
    const wrapper = shallow(<PostsList posts={posts} />);
    expect(wrapper).toMatchSnapshot();
  });
});
