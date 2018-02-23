import React, {Component} from 'react';
import styles from './TopOptionsBar.scss';
import PropTypes from 'prop-types';


export default class TopOptionsBar extends Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  };

  render() {
    const {children} = this.props;

    return (
      <div className={styles.topOptionsBar}>
        {children}
      </div>
    )
  }
}
