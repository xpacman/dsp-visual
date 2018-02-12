import React, { Component, PropTypes } from 'react';
import { Button, Col, Row } from 'reactstrap';
import { connect } from 'react-redux';
import GoogleMap from '../../components/GoogleMap/GoogleMap';
import styles from '../../../scss/views/search.scss';
import { search } from '../../reducers/search';

@connect(
  state => ({
    places: state.search.places,
  }),
  {
    search
  }
)
class Search extends Component {
  static propTypes = {
    search: PropTypes.func.isRequired,
    places: PropTypes.arrayOf(PropTypes.object),
  };

  componentDidMount() {
    this.props.search();
  }

  render() {
    const loading = !this.props.places || !this.props.places.length;
    return (
      <div className={styles.container}>
        <Row>
          <Col xs={8}>
            {loading ? <div>loading</div> : (
              <GoogleMap
                places={this.props.places}
              />)}
          </Col>
          <Col xs={4}>
            <Button>search?</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Search;