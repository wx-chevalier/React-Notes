import React from 'react';
import { shallow, mount } from 'enzyme';
import { NewPost } from './NewPost';

// Stubbed functions
// describe("post creation", () => {
//     describe("title not provided", () => {
//         it("displays error message");
//     });

//     describe("body not provided", () => {
//         it("displays error message");
//     });

//     describe("valid input provided", () => {
//         it("fires onPostCreated event");
//         it("resets form values to empty");
//     });
// })

describe('NewPost', () => {
  it('renders empty by default', () => {
    const wrapper = shallow(<NewPost onPostCreated={jest.fn()} />);
    expect(wrapper).toMatchSnapshot();
  });

  describe('post creation', () => {
    describe('#onPostValueChanged fired', () => {
      it('unit: updates respective input value state', () => {
        const event = { target: { value: 'Test Value' } };
        const wrapper = shallow(<NewPost onPostCreated={jest.fn()} />);
        (wrapper.instance() as NewPost).onPostValueChanged('title')(event);
        expect(wrapper.state('title')).toBe('Test Value');
      });

      it('integration: updates respective input value state', () => {
        const event = { target: { value: 'Test Value' } };
        const wrapper = shallow(<NewPost onPostCreated={jest.fn()} />);
        wrapper
          .find('input')
          .at(0)
          .simulate('change', event);
        expect(wrapper.state('title')).toBe('Test Value');
      });
    });

    describe('title not provided', () => {
      it('displays error message', () => {
        // UH OH, test with state directly?
        const wrapper = mount<NewPost>(<NewPost onPostCreated={jest.fn()} />);

        // Needed a mount here because instance can not be accessed in shallow()
        (wrapper
          .find('input')
          .at(1)
          .instance() as any).value = 'Example Body';

        wrapper.find('button').simulate('click');
        expect(wrapper.state('errorMessage')).toBe('Title not provided');
      });
    });

    describe('body not provided', () => {
      it('displays error message', () => {
        const wrapper = mount(<NewPost onPostCreated={jest.fn()} />);
        wrapper.setState({ title: 'Example Title' });
        wrapper.find('button').simulate('click');
        expect(wrapper.state('errorMessage')).toBe('Body not provided');
      });
    });

    describe('valid input provided', () => {
      describe('with prior error', () => {
        it('clears error', () => {
          const wrapper = shallow(<NewPost onPostCreated={jest.fn()} />);
          wrapper.setState({ errorMessage: 'Failz' });
          wrapper.setState({ title: 'Example Title', body: 'Example Body' });
          wrapper.find('button').simulate('click');
          expect(wrapper.state('errorMessage')).toBe('');
        });
      });

      it('fires onPostCreated event', () => {
        const mockedEvent = jest.fn();
        const wrapper = mount(<NewPost onPostCreated={mockedEvent} />);
        wrapper.setState({ title: 'Example Title', body: 'Example Body' });
        wrapper.find('button').simulate('click');
        expect(wrapper.state('errorMessage')).toBe('');
        expect(mockedEvent.mock.calls.length).toBe(1);
      });

      it('resets form values to empty', () => {
        const mockedEvent = jest.fn();
        const wrapper = mount<NewPost>(<NewPost onPostCreated={mockedEvent} />);
        wrapper.setState({ title: 'Example Title', body: 'Example Body' });
        wrapper.find('button').simulate('click');
        expect(wrapper.state('errorMessage')).toBe('');

        const { title, body } = wrapper.state();
        expect(title).toBe('');
        expect(body).toBe('');
      });
    });
  });
});
