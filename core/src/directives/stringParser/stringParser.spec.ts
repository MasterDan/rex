import { getKeysToInsert, parseTemplateString } from './stringParser';

describe('string Parser', () => {
  test('get keys', () => {
    expect(getKeysToInsert('Hello, {{ word }}')).toEqual(['word']);
    expect(getKeysToInsert('Hello, {{word}}')).toEqual(['word']);
    expect(getKeysToInsert('Hello, {{  word}}')).toEqual(['word']);
    expect(getKeysToInsert('Hello, {{  word     }}')).toEqual(['word']);
    expect(getKeysToInsert('Hello')).toEqual([]);
  });
  test('parse simple', () => {
    const parsed = parseTemplateString('Hello, {{ word }}', { word: 'world' });
    const parsed2 = parseTemplateString('Hello, {{word}}', { word: 'world' });
    const parsed3 = parseTemplateString('Hello, {{  word    }}', {
      word: 'world',
    });
    expect(parsed).toBe('Hello, world');
    expect(parsed2).toBe('Hello, world');
    expect(parsed3).toBe('Hello, world');
  });
  test('parse empty', () => {
    expect(parseTemplateString('Foo')).toBe('Foo');
  });
});
