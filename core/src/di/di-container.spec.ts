import { DiContainer } from './di-container';

describe('di', () => {
  test('provide-inject', () => {
    const testObject = { foo: 'bar' };
    const container = new DiContainer();
    const { inject, token } = container.provide<typeof testObject>(testObject);
    const injected = inject();
    const resolved = container.resolve<typeof testObject>(token);
    expect(injected).toEqual(testObject);
    expect(resolved).toEqual(testObject);
  });
});
