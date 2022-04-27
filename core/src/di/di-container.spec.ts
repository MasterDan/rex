import { DiContainer } from './di-container';

describe('di', () => {
  test('provide-inject', () => {
    const testObject = { foo: 'bar' };
    const container = new DiContainer();
    const { inject } = container.provide<typeof testObject>(testObject);
    const injected = inject();
    expect(injected).toEqual(testObject);
  });
});
