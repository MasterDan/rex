import { Ref } from '../scope/ref';
import { Scope } from '../scope/scope';
import { DiContainerReactive } from './diContainerReactive';

describe('reactive dependecyResolver', () => {
  test('provide-resolve', () => {
    const ref = new Ref<string>('foo');
    const scope = new Scope({ ref });
    scope.setContainer(new DiContainerReactive());
    const resolved$ = scope.resolveReactive<Ref<string>>('ref');
    const sub = jest.fn((arg: Ref<string>) => {
      expect(arg.value).toBe('foo');
    });
    resolved$.subscribe(sub);
    expect(sub).toBeCalled();
  });
});
