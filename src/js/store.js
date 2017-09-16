import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import reducersList from './reducers';

const reducer = combineReducers({ ...reducersList });

export default createStore(reducer, applyMiddleware(
  thunkMiddleware,
));