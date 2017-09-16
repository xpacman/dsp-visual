const SEARCH = 'search/SEARCH';
const PREPARE_SEARCH = 'search/PREPARE_SEARCH';

function getPlaces(stringLocation) {
  return [
    {
	  lat: 48.170137,
	  lng: 17.077122,
	  text: 'place1',
    },
    {
	  lat: 48.171081,
	  lng: 17.073088,
	  text: 'place2',
	},
    {
	  lat: 48.173371,
	  lng: 17.070138,
	  text: 'place3',
	},
    {
	  lat: 48.171518,
	  lng: 17.067230,
	  text: 'place4',
	},
    {
	  lat: 48.174687,
	  lng: 17.069470,
	  text: 'place5',
	},
    {
	  lat: 48.177098,
	  lng: 17.066326,
	  text: 'place6',
	},
    {
	  lat: 48.170197,
	  lng: 17.077122,
	  text: 'place7',
	},
    {
	  lat: 48.183533,
	  lng: 17.066282,
	  text: 'place8',
	},
    {
	  lat: 48.186144,
	  lng: 17.067784,
	  text: 'place9',
	},
    {
	  lat: 48.186130,
	  lng: 17.077461,
	  text: 'place10',
	},
    {
	  lat: 48.182599,
	  lng: 17.093779,
	  text: 'place11',
	},
  ];
}

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