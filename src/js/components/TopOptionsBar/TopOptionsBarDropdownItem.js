/**
 * Created by paco on 22.2.18.
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
import styles from './TopOptionsBar.scss';

export default class TopOptionsBarDropdownItem extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.string]),
    toggle: PropTypes.func.isRequired,
    dropdownToggleText: PropTypes.string.isRequired,
    dropdownClass: PropTypes.string,
    dropdownMenuClass: PropTypes.string
  };

  static defaultProps = {
    isOpen: false,
    dropdownClass: "",
    dropdownToggleClass: "",
    dropdownMenuClass: ""
  };

  render() {
    const {children, isOpen, toggle, dropdownMenuClass, dropdownToggleClass, dropdownClass, dropdownToggleText} = this.props;

    return (
      <Dropdown className={`${styles["topOptionsBar__item--dropdown"]} ${dropdownClass}`}
                isOpen={isOpen}
                toggle={toggle}>
        <DropdownToggle
          tag="span"
          className={`${dropdownToggleClass} ${styles["topOptionsBar__item--dropdown__dropdownToggle"]}`}
          onClick={toggle}
          data-toggle="dropdown"
          aria-expanded={isOpen}
          caret>
          {dropdownToggleText}
        </DropdownToggle>
        <DropdownMenu className={`${dropdownMenuClass} ${styles["topOptionsBar__item--dropdown__dropdownMenu"]}`}>
          {children}
        </DropdownMenu>
      </Dropdown>
    )
  }
}
