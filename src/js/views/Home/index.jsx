import React, { Component } from 'react';
import Google from '../../../img/google.png';
import Alaska from '../../../img/alaska.jpg';

import Styles from '../../../scss/views/home';

import Counter from '../../components/Counter';

export default class extends Component {
  
  render() {
    return (
      <div>
        <h1 style={{margin: '0 0 34px'}}>Home</h1>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <strong>Redux counter</strong><br />
          <Counter />
        </div>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <strong>Base64 data:image (under 10kb)</strong><br />
          <img src={Google} alt="Google" />
        </div>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <strong>Standard src img (over 10kb)</strong><br />
          <img src={Alaska} width="300" alt="Alaska" />
        </div>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <p className={Styles.module}>This is a css module class</p>
        </div>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <p className="global">This is a global css class</p>
        </div>
        <div style={{padding: '0 0 24px', margin: '0 0 24px', borderBottom: 'solid 2px #ddd'}}>
          <p>Fake API key from .env: <strong>{process.env.FAKE_API_KEY}</strong></p>
        </div>
      </div>
    )
  }
    
}