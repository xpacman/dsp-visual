import React, { Component, PropTypes } from 'react';
import GoogleMapReact from 'google-map-react';
import config from '../../config';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

class GoogleMap extends Component {
  static propTypes = {
    places: PropTypes.array,
    zoom: PropTypes.number,
  };

  static defaultProps = {
    places: [{}],
    zoom: 11
  };

  render() {
    console.log('places', this.props.places);
    return (
      <GoogleMapReact
        apiKey={config.googleMapApiKey}
        defaultCenter={this.props.places[0]}
        defaultZoom={this.props.zoom}
      >
        {this.props.places.map((place, index) => (<AnyReactComponent
          key={index}
          lat={place.lat}
          lng={place.lng}
          text={place.text}
        />))}
      </GoogleMapReact>
    );
  }
}

export default GoogleMap;