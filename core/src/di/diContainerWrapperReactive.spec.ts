import { DiContainerReactive } from './diContainerReactive';
import { DiContainerWrapperReactive } from './diContainerWrapperReactive';

describe('diContainerWrapper', () => {
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
});
