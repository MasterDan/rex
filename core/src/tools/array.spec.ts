import { arrayEquals, removeItem } from './array';

describe('Array tools', () => {
  test('RemoveItem', () => {
    const array = [1, 2, 3];
    const newArray = removeItem(array, 2);
    expect(newArray).toEqual([1, 3]);
  }),
    test('Equals', () => {
      expect(arrayEquals([], [])).toBe(true);
      expect(arrayEquals(['one'], [])).toBe(false);
      expect(arrayEquals(['one'], ['one'])).toBe(true);
      expect(arrayEquals(['one', 'two'], ['one'])).toBe(false);
      expect(arrayEquals(['one', 'two'], ['one', 'two'])).toBe(true);
    });
});
