import React, { Component } from 'react'
import {connect} from 'react-redux';
import {increase, decrease} from '../actions/counter.action';

class Counter extends Component {
  render() {
    return (
      <div>
        <span>{this.props.counter.count}</span>
        <button onClick={this.props.increase}>Increase</button>
        <button onClick={this.props.decrease}>Decrease</button>
      </div>
    )
  }
}

export default connect(
    state => ({counter: state.counter}),
    {increase, decrease}
)(Counter);