const SEARCH = 'search/SEARCH';
const PREPARE_SEARCH = 'search/PREPARE_SEARCH';

const initialState = {
  places: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case PREPARE_SEARCH:
	  return { ...state };
    case SEARCH:
	  return { ...state, stringLocation: action.stringLocation, places: action.places };
    default:
	  return state;
  }
};

export function search(stringLocation) {
  return (dispatch) => {
    dispatch({ type: PREPARE_SEARCH });
    setTimeout(() => {
      dispatch({
        type: SEARCH,
        stringLocation,
        places: getPlaces(stringLocation)
      });
    }, 1000);
  };
}