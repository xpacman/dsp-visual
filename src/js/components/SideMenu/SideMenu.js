/**
 * Created by paco on 16.10.17.
 */

import React from "react";
import PropTypes from "prop-types";
import {Nav, NavItem} from "reactstrap";
import routes from "../../routes";
import {Link} from "react-router-dom";
import {connect} from "react-redux";
import * as actions from "../../actions/actions";
import styles from "./SideMenu.scss"; // To include in bundle

@connect(state => ({
  collapsed: state.sideMenu.collapsed,
  activePath: state.sideMenu.activePath,
}), {
  onCollapse: actions.collapseMenu
})
export default class SideMenu extends React.Component {

  static propTypes = {
    collapsed: PropTypes.bool,
    onCollapse: PropTypes.func,
    activePath: PropTypes.string
  };

  static defaultProps = {
    collapsed: false,
    activePath: null
  };

  render() {
    const {collapsed, onCollapse, activePath} = this.props;

    return (
      <Nav id="sidemenu" className={`${styles.sideMenu} ${collapsed ? styles["sideMenu--collapsed"] : ""}`}>
        <NavItem className={`${styles.sideMenu__item}`}>
          {!collapsed ?
            <h2 className={`${styles.sideMenu__item__link} ${styles.brand_logo}`}>GraphiX</h2> :
            <h2 className={`${styles.sideMenu__item__link} ${styles.brand_logo}`}>VUT FEKT</h2>
          }
        </NavItem>
        {
          routes.map((route, i) => {
            return (
              <NavItem key={i}
                       className={`${styles.sideMenu__item} ${route.slug === activePath ? styles["sideMenu__item--active"] : ""}`}>
                <Link id={`sideMenu__item-${i}`} className={`${styles.sideMenu__item__link }`}
                      to={route.slug}>{route.short}</Link>
              </NavItem>
            );
          })
        }
      </Nav>
    )
  }
}
