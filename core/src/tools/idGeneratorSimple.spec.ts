import { newId } from './idGeneratorSimple';

describe('id generator', () => {
  test('generate some', () => {
    const first = newId('foo');
    const second = newId('foo');
    expect(first).not.toBe(second);
  });
  test('generate many', () => {
    const len = 1000;
    const array = [...new Array(len)].map(() => newId('arr'));
    const arrayDistincted = array.filter((e, i, a) => a.indexOf(e) === i);
    expect(array.length).toBe(arrayDistincted.length);
  });
});
