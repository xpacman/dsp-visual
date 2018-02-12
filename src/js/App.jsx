import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import {Provider} from 'react-redux';
import store from './store';

import styles from '../scss/app.scss';

import Home from './views/Home';
import NotFound from './views/NotFound';

export default class App extends Component {

  render() {
    return (
      <Provider store={store}>
        <Router>
          <div className={styles.root}>
            <Switch>
              <Route exact path="/" component={Home}/>
              <Route component={NotFound}/>
            </Switch>
          </div>
        </Router>
      </Provider>
    );
  }
}
