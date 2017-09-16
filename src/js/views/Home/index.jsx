import React from 'react';
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem, NavLink, Container, Row, Col } from 'reactstrap';
import IconBath from 'react-icons/lib/fa/beer';
import styles from './home.scss';
import { Link } from 'react-router-dom';

export default class Example extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <div className={styles.container}>

        <Navbar color="white" light toggleable>
          <NavbarToggler right onClick={this.toggle} />
          <NavbarBrand href="/">&nbsp;</NavbarBrand>
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink href="/components/">Prihlasenie</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="https://github.com/reactstrap/reactstrap">O projekte</NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>

        <h1 className={styles.mainTitle}>Vyhladajte spomedzi 1000 inzeratov</h1>

        <Container>

          <Row className={styles.propertyTypeSelector}>

            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Byty</span></Link></Col>
            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Domy</span></Link></Col>
            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Projekty</span></Link></Col>

          </Row>

          <Row className={styles.propertyTypeSelector}>
            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Pozemky</span></Link></Col>
            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Komercne</span></Link></Col>
            <Col md="4" xs="6"><Link to={'/'}><IconBath /> <span>Ostatne</span></Link></Col>
          </Row>

        </Container>


        <Container className={styles.searchOptions}>
          <Row>
            <Col xs="12">
              <h4>Byty na predaj</h4>
            </Col>
          </Row>

          <Row>
            <Col xs="12">
              <h4>Oblubene</h4>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}
