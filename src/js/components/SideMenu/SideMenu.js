/**
 * Created by paco on 16.10.17.
 */

import React from "react";
import PropTypes from "prop-types";
import {Nav, NavItem} from "reactstrap";
import routes from "../../routes";
import {Link, NavLink} from "react-router-dom";
import styles from "./SideMenu.scss"; // To include in bundle

export default class SideMenu extends React.Component {

  static propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  };

  render() {
    const {match, location, history} = this.props;

    return (
      <Nav id="sidemenu" className={`${styles.sideMenu}`}>
        <NavItem className={`${styles.sideMenu__item}`}>
          <h2 className={`${styles.sideMenu__item__link} ${styles.brand_logo}`}>
            <Link id="brand-link" to={"/"}>VUT FEKT</Link>
          </h2>
        </NavItem>
        {
          routes.map((route, i) => {
            return (
              <NavItem key={i}
                       className={`${styles.sideMenu__item}`}>
                <NavLink exact id={`sideMenu__item-${i}`} className={`${styles.sideMenu__item__link }`}
                         activeClassName={styles.isActive} to={route.slug}>{route.short}</NavLink>
              </NavItem>
            );
          })
        }
      </Nav>
    )
  }
}
