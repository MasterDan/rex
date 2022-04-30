import { DiContainer } from './diContainer';

describe('diContainer', () => {
  test('provide-inject-symbolic', () => {
    const testObject = { foo: 'bar' };
    const container = new DiContainer();
    const { resolve, token } =
      container.register<typeof testObject>(testObject);
    const injected = resolve();
    const resolved = container.resolve<typeof testObject>(token);
    expect(injected).toEqual(testObject);
    expect(resolved).toEqual(testObject);
  });
  test('provide-inject-string', () => {
    const testObject = { foo: 'bar' };
    const container = new DiContainer();
    container.register<typeof testObject>(testObject, 'test-obj');
    const injected = container.resolve<typeof testObject>('test-obj');
    expect(injected).toEqual(testObject);
  });
  test('provide-error', () => {
    const testObject = { foo: 'bar' };
    const container = new DiContainer();
    const func = () => {
      container.register<typeof testObject>(testObject, 'test-obj');
      container.register<typeof testObject>(testObject, 'test-obj');
    };
    expect(func).toThrowError();
  });
});
