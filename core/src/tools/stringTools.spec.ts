import { isNullOrWhiteSpace } from './stringTools';

describe('stringTools', () => {
  test('isNullOrWhitespace', () => {
    expect(isNullOrWhiteSpace('foo')).toBe(false);
    expect(isNullOrWhiteSpace('')).toBe(true);
    expect(isNullOrWhiteSpace(' ')).toBe(true);
    expect(isNullOrWhiteSpace(null)).toBe(true);
  });
});
