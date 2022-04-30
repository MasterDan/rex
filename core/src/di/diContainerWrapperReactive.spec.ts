import { DiContainerReactive } from './diContainerReactive';
import { DiContainerWrapperReactive } from './diContainerWrapperReactive';

describe('diContainerWrapperReactive', () => {
  test('provide-inject', () => {
    const container = new DiContainerReactive();
    const upperScope = new DiContainerWrapperReactive(container);
    container.registerReactive<string>('Foo', 'foo-bar');
    container.registerReactive<string>('Resolved From Parent', 'parent');
    upperScope.registerReactive<string>('Bar', 'foo-bar');

    expect(container.resolveReactive('parent').value).toBe(
      'Resolved From Parent',
    );
    expect(upperScope.resolveReactive('parent').value).toBe(
      'Resolved From Parent',
    );
    expect(container.resolveReactive('foo-bar').value).toBe('Foo');
    expect(upperScope.resolveReactive('foo-bar').value).toBe('Bar');
  });
  test('resove before injection', () => {
    const container = new DiContainerReactive();
    const upperScope = new DiContainerWrapperReactive(container);

    const foo = container.resolveReactive('foo-bar');
    const bar = upperScope.resolveReactive('foo-bar');

    container.registerReactive<string>('Foo', 'foo-bar');
    container.registerReactive<string>('Resolved From Parent', 'parent');
    upperScope.registerReactive<string>('Bar', 'foo-bar');

    expect(container.resolveReactive('parent').value).toBe(
      'Resolved From Parent',
    );
    expect(upperScope.resolveReactive('parent').value).toBe(
      'Resolved From Parent',
    );
    expect(foo.value).toBe('Foo');
    expect(bar.value).toBe('Bar');
  });
});
