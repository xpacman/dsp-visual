import React from 'react';
import { NavLink } from 'react-router-dom';
import { Nav, NavItem } from 'reactstrap';

const Primary = () => (
  <Nav className="pull-right">
    <NavItem><NavLink exact to="/">Home</NavLink></NavItem>
  </Nav>
);

export default Primary;