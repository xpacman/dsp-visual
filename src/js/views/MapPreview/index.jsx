import React, {Component} from 'react';
import styles from './preview.scss';

export default class MapPreview extends Component {

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.mapContainer}>
          Map
        </div>
        <div className={[styles.previewContainer, "ml-5", "mr-5"].join(" ")}>
          {this.props.children}
          resultss
        </div>
      </div>);
  }
}
