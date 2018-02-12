import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';
import store from './store';
import {SideMenu} from './components';
import styles from '../scss/app.scss';
import Home from './views/Home';
import NotFound from './views/NotFound';
import Regression from './views/Regression'

export default class App extends Component {

  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className={`${styles.mainWrapper} ${styles["mainWrapper--menuCollapsed"]}`}>
            <SideMenu />
            <Switch>
              <Route exact path="/" component={Home}/>
              <Route path="/regrese" component={Regression}/>
              <Route component={NotFound}/>
            </Switch>
          </div>
        </Router>
      </Provider>
    );
  }
}
