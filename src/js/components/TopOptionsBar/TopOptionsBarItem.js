import React, {Component} from 'react';
import styles from './TopOptionsBar.scss';
import PropTypes from 'prop-types';


export default class TopOptionsBarItem extends Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
  };

  static defaultProps = {
    className: ""
  };

  render() {
    const {children, className} = this.props;

    return (
      <div className={`${className} ${styles.topOptionsBar__item}`}>
        {children}
      </div>
    )
  }
}
