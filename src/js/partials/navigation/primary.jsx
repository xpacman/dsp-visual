import React from 'react';
import {NavLink} from 'react-router-dom';

const Primary = () => (
  <nav>
    <ul>
      <li><NavLink exact to="/">Home</NavLink></li>
      <li><NavLink to="/about">About</NavLink></li>
      <li><NavLink to="/this/will/404">Broken link</NavLink></li>
    </ul>
  </nav>
);

export default Primary;