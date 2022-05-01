import { filter, switchMap } from 'rxjs';
import { DiContainerReactive } from '../di/diContainerReactive';
import { Ref } from './ref';
import { Scope } from './scope';

describe('scope', () => {
  test('providing', () => {
    const container = new DiContainerReactive();
    const scope = new Scope({
      foo: new Ref<string>('fooo'),
    });
    scope.setContainer(container);
    const subscription = jest.fn((val: string | null) => {
      expect(val).toBe('fooo');
    });
    container
      .resolveReactive<Ref<string>>('foo')
      .pipe(
        filter((v): v is Ref<string> => v != null),
        switchMap((ref) => ref),
      )
      .subscribe(subscription);
    expect(subscription).toBeCalled();
  });
});
