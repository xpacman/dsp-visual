import React from 'react';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem} from 'reactstrap';
import styles from './regression.scss';


export default class Regression extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        aproximation: false
      }
    };
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  render() {
    const {dropdowns} = this.state;

    return (
      <div className={styles.container}>
        <div className={styles.topOptionsBar}>
          <div className={`${styles.topOptionsBar__item}`}>
            Aproximace
          </div>
          <Dropdown className={`${styles["topOptionsBar__item--dropdown"]}`}
                    isOpen={dropdowns.inputValues}
                    toggle={this.toggleDropdown.bind(this, "inputValues")}>
            <DropdownToggle
              tag="span"
              className={`${styles["topOptionsBar__item--dropdown__dropdownToggle"]}`}
              onClick={this.toggleDropdown.bind(this, "inputValues")}
              data-toggle="dropdown"
              aria-expanded={dropdowns.inputValues}
              caret>
              Vstupní hodnoty
            </DropdownToggle>
            <DropdownMenu className={`${styles["topOptionsBar__item--dropdown__dropdownMenu"]}`}>
              <DropdownItem header>Header</DropdownItem>
              <DropdownItem disabled>Action</DropdownItem>
              <DropdownItem>Another Action</DropdownItem>
              <DropdownItem divider/>
              <DropdownItem>Another Action</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    );
  }
}
