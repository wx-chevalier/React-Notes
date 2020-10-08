import React from 'react';
import { shallow } from 'enzyme';

import { Post } from './Post';

// Stubbed example
// describe("reverse title button clicked", () => {
//     it("reverses title");
// });

describe('Post', () => {
  const examplePost = {
    index: 0,
    title: 'Hello World!',
    body: 'Learning about tests 💯'
  };

  it("renders a post's title and body", () => {
    const wrapper = shallow(<Post {...examplePost} />);
    expect(wrapper).toMatchSnapshot();
  });

  describe('reverse title button clicked', () => {
    it('reverses title', () => {
      const wrapper = shallow(<Post {...examplePost} />);
      wrapper.find('#reverse').simulate('click');
      expect(wrapper.state('showTitleBackwards')).toBeTruthy();
      expect(
        wrapper
          .find('td')
          .first()
          .text()
      ).toEqual('!dlroW olleH');
    });
  });

  describe('delete button clicked', () => {
    it('fires onPostDeleted event', () => {
      const mockedEvent = jest.fn();
      const wrapper = shallow(<Post {...examplePost} onPostDeleted={mockedEvent} />);
      wrapper.find('#delete').simulate('click');
      expect(mockedEvent.mock.calls.length).toBe(1);
    });
  });
});
