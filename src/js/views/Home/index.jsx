import React from 'react';
import {Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem, NavLink, Container, Row, Col} from 'reactstrap';
import styles from './home.scss';
import {Link} from 'react-router-dom';

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  toggle() {
    console.log("test");
  }

  render() {
    return (
      <div className={styles.container}>
        <Navbar color="white" expand>
          <NavbarToggler onClick={this.toggle}/>
          <NavbarBrand href="/">Static Pack</NavbarBrand>
        </Navbar>
      </div>
    );
  }
}
