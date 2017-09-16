import { INCREASE, DECREASE } from '../constants/counter.contant';

export function increase() {
  return {
    type: INCREASE
  };
}

export function decrease() {
  return {
    type: DECREASE
  };
}