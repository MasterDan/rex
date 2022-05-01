import { DiContainerClassic } from './diContainerClassic';
import { DiContainerWrapperClassic } from './diContainerWrapperClassic';

describe('di Container classic wrapper', () => {
  test('provide-inject', () => {
    const container = new DiContainerClassic();
    const upperScope = new DiContainerWrapperClassic(container);
    container.register<string>('Foo', 'foo-bar');
    container.register<string>('Resolved From Parent', 'parent');
    upperScope.register<string>('Bar', 'foo-bar');

    expect(container.resolve('parent')).toBe('Resolved From Parent');
    expect(upperScope.resolve('parent')).toBe('Resolved From Parent');
    expect(container.resolve('foo-bar')).toBe('Foo');
    expect(upperScope.resolve('foo-bar')).toBe('Bar');
  });
});
