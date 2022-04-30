import { DiContainer } from './diContainer';
import { DiContainerWrapper } from './DiContainerWrapper';

describe('diContainerWrapper', () => {
  test('provide-inject', () => {
    const container = new DiContainer();
    const upperScope = new DiContainerWrapper(container);
    container.register<string>('Foo', 'foo-bar');
    container.register<string>('Resolved From Parent', 'parent');
    upperScope.register<string>('Bar', 'foo-bar');

    expect(container.resolve('parent')).toBe('Resolved From Parent');
    expect(upperScope.resolve('parent')).toBe('Resolved From Parent');
    expect(container.resolve('foo-bar')).toBe('Foo');
    expect(upperScope.resolve('foo-bar')).toBe('Bar');
  });
});
