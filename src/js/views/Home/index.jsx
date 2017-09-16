import React, { Component } from 'react';
import { Button, Container, Col, Row } from 'reactstrap';
import GoogleMap from '../../components/GoogleMap/GoogleMap';
import styles from '../../../scss/views/home.scss';

export default class extends Component {

  render() {
    return (
      <div className={styles.container}>
        <Row>
          <Col xs={8}>
            <GoogleMap />
          </Col>
          <Col xs={4}>
            <Button>sads</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

