import React, { Component, PropTypes } from 'react';
import styles from './GoogleMap.scss';

class BasicMarker extends Component {
  static propTypes = {
	text: PropTypes.string,
  };

  render() {
	return (
	  <div className={styles.basicMarker} title={this.props.text}></div>
	);
  }
}

export default BasicMarker;