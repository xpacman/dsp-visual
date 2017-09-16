import React from 'react';
import {shallow} from 'enzyme';
import About from '../../src/js/views/About/index';

describe('<About /> page', () => {
  let component;

  beforeEach(() => {
    component = shallow(<About />);
  });

  it('should exist', () => {
    expect(component).toBeDefined();
  });

  it('should have one <h1>', () => {
    expect(component.find('h1')).toHaveLength(1);
  });
});
