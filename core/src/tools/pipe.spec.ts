import { pipeIt } from './pipe';

describe('functional pipeline', () => {
  test('simple pipe', () => {
    const result = pipeIt(() => 'hello')
      .then((str) => str.length)
      .then((val) => val + 1)
      .run();
    expect(result).toBe(6);
  });
});
