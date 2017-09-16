import React from 'react';
import { NavLink } from 'react-router-dom';
import { Nav, NavItem } from 'reactstrap';

const Primary = () => (
  <Nav className="pull-right">
    <NavItem><NavLink exact to="/">Home</NavLink></NavItem>
	<NavItem><NavLink exact to="/hladanie">Search</NavLink></NavItem>
	<NavItem><NavLink to="/about">About</NavLink></NavItem>
  </Nav>
);

export default Primary;