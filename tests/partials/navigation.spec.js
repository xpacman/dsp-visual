import React from 'react';
import {shallow} from 'enzyme';
import Primary from '../../src/js/partials/navigation/primary';
import {NavLink} from 'react-router-dom';

describe('<Primary /> partial', () => {
  let component;
  
  beforeEach(() => {
    component = shallow(<Primary />);
  });
  
  it('should exist', () => {
    expect(component).toBeTruthy();
  });
  
  it('contains 3 <NavLink /> components', () => {
    expect(component.find(NavLink)).toHaveLength(3)
  });
})
