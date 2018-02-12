/**
 * Created by paco on 12.2.18.
 */

import {
  COLLAPSE_MENU
} from '../actions/actions';

const initialState = {
  collapsed: true,
  activePath: '/'
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case COLLAPSE_MENU:
      return {collapsed: action.payload};

    default:
      return state;
  }
}
