import React, { Component } from 'react';
import { Button, Container, Col, Row } from 'reactstrap';
import styles from '../../../scss/views/home.scss';

export default class extends Component {
  render() {
    return (
      <div className={styles.container}>
        <Row>
          <Col xs={12}>
            Serus'
          </Col>
        </Row>
      </div>
    );
  }
}

