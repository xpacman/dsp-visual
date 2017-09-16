import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';

const Primary = () => (
  <Nav className="pull-right">
    <NavItem><NavLink exact to="/">Home</NavLink></NavItem>
    <NavItem><NavLink to="/about">About</NavLink></NavItem>
  </Nav>
);

export default Primary;