import { filter } from 'rxjs';
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
  test('resolve resolver', () => {
    const ref = new Ref<string>('foo');
    const container = new DiContainerReactive();
    const { resolve: resolveScope } = container.register<Scope>(
      new Scope({ ref }),
    );
    const scope = resolveScope();
    expect(scope.container$.value).not.toBeNull();

    const resolved$ = scope.resolveReactive<Ref<string>>('ref');
    const sub = jest.fn((arg: Ref<string>) => {
      expect(arg.value).toBe('foo');
    });
    container
      .resolveReactive<Ref<string>>('ref')
      .pipe(filter((v): v is Ref<string> => v != null))
      .subscribe(sub);
    resolved$.subscribe(sub);
    expect(sub).toBeCalledTimes(2);
  });
});
