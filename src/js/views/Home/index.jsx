import React from 'react';
import {Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem, NavLink, Container, Row, Col} from 'reactstrap';
import styles from './home.scss';

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {

    console.log("test");

    return (
      <div className={styles.container}>
      </div>
    );
  }
}
