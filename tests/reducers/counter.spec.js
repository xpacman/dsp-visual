import reducer from '../../src/js/reducers/counter.reducer';
import {INCREASE, DECREASE} from '../../src/js/constants/counter.contant';

describe('The counter reducer', () => {
  it('returns the default state object', () => {
    const result = reducer(undefined, {type:'ANYTHING'})
    expect(result).toBeDefined()
  });
  
  test('returns zero count initially', () => {
    const result = reducer(undefined, {type:'ANYTHING'})
    expect(result.count).toBe(0);
  });
  
  test('it increases the counter', () => {
    const action = {type: INCREASE};
    const result = reducer(undefined, action);
    expect(result.count).toBe(1);
  });
  
  test('it decreases the counter', () => {
    const action = {type: DECREASE};
    const result = reducer(undefined, action);
    expect(result.count).toBe(-1);
  });
});