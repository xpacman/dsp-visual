import React, {Component} from 'react';
import {Row, Col, ListGroup, ListGroupItem, Button} from 'reactstrap';
import Carousel from '../Carousel/Carousel';
import styles from './resultContent.scss';

export default class ResultContent extends Component {

  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div>
          <Carousel/>
          <h2 className={"mt-4"}>
            {this.props.realtyData.title}
          </h2>
          <h4 className={"text-muted"}>
            {this.props.realtyData.locality}
          </h4>
          <h2>{this.props.realtyData.price} €</h2>
          <p className={[styles.realtyInfo, "mt-4","mb-4"].join(" ")}>
            {this.props.realtyData.info}
          </p>
          <Row>
            <Col xs={12} md={6}>
              <ListGroup>
                <ListGroupItem>
                  <Row>
                    <Col>Celková cena</Col>
                    <Col>1 000 000 € za nehnuteľnosť</Col>
                  </Row>
                </ListGroupItem>
                <ListGroupItem>
                  <Row>
                    <Col>Poznámka k cene</Col>
                    <Col>Případně 1.490.000 Euro. Hypoteční a právní servis.</Col>
                  </Row>
                </ListGroupItem>
              </ListGroup>
            </Col>
            <Col xs={12} md={6}>
              <ListGroup>
                <ListGroupItem>
                  <Row>
                    <Col>Podlažie</Col>
                    <Col>5. podlaží z celkem 5.</Col>
                  </Row>
                </ListGroupItem>
              </ListGroup>
            </Col>
          </Row>
          <Row className={"mt-5"}>
            <Col className={"text-center"}>
              {
                ["Pridať do obľúbených",
                  "Zdielať inzerát",
                  "Tlačiť",
                  "Pridať poznámku"
                ].map( value =>
                  <Button key={value} outline color="primary" className={"mr-3"}>{value}</Button>
                )}
            </Col>
          </Row>
          <form className={[styles.contactForm,"mt-4","pt-4"].join(" ")}>
            <h2 className={"mb-3"}>
              Kontaktovať:
            </h2>
            <Row>
              <Col md={3}>
                User photo
              </Col>
              <Col>
                <h5>Roman Kočvara</h5>
                <p><span>Mobil:</span>+420 608 149</p>
                <p><span>Email:</span>kocvara@oxes.cz</p>
              </Col>
            </Row>

          </form>
      </div>
    );
  }

}
