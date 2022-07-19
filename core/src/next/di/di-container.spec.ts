import { filter, Observable } from 'rxjs';
import { testScope } from '../constants';
import { diContainer } from './di-container';
import { Resolvable } from './resolvable.decorator';

@Resolvable({ key: 'foo' })
class Foo {
  bar = 'bar';
}

@Resolvable()
class Bar {
  foo = 5;
}

@Resolvable({ dependencies: ['foo', Bar] })
class Baz {
  constructor(public foo: Foo, public bar: Bar) {}
}

@Resolvable({ dependencies: [{ key: 'xxx', reactive: true }] })
class Fooz {
  constructor(public xxx: Observable<string | null>) {}
}

@Resolvable({ dependencies: [Fooz, Baz] })
class Bazz {
  constructor(public fooz: Fooz, public baz: Baz) {}
}

@Resolvable({ scope: testScope, dependencies: [Fooz, Baz] })
class BazzScoped {
  constructor(public fooz: Fooz, public baz: Baz) {}
}

describe('provide', () => {
  test('resolve foo using key', () => {
    // const _foo = new Foo();
    const fooResolved = diContainer.resolve<Foo>('foo');
    expect(fooResolved).not.toBeNull();
    expect(fooResolved?.bar).toBe('bar');
  });
  test("resolve bar by it's type", () => {
    const bar = diContainer.resolve(Bar);
    expect(bar).not.toBeNull();
    expect(bar?.foo).toBe(5);
  });
  test('create Baz that resolves from Di', () => {
    const baz = diContainer.resolve<Baz>(Baz);
    expect(baz).not.toBeNull();
    expect(baz?.foo).not.toBeNull();
    expect(baz?.foo).not.toBeUndefined();
    expect(baz?.foo.bar).toBe('bar');
    expect(baz?.bar).not.toBeNull();
    expect(baz?.bar).not.toBeUndefined();
    expect(baz?.bar.foo).toBe(5);
  });
  test('resolve reactive', () => {
    const fooz = diContainer.resolve(Fooz);
    expect(fooz).not.toBeNull();
    fooz?.xxx.pipe(filter((x): x is string => x != null)).subscribe((v) => {
      expect(v).toBe('yyy');
    });
    diContainer.register<string>({
      key: 'xxx',
      reactive: 'yyy',
    });
  });
  test('complex resolve', () => {
    const bazz = diContainer.resolve(Bazz);
    expect(bazz).not.toBeNull();
    expect(bazz?.baz.bar.foo).toBe(5);
    expect(bazz?.baz.foo.bar).toBe('bar');
    bazz?.fooz.xxx
      .pipe(filter((x): x is string => x != null))
      .subscribe((v) => expect(v).toBe('yyy'));
  });
  test('complex resolve Scoped', () => {
    diContainer.startScope(testScope);
    const bazz = diContainer.resolve(BazzScoped);
    expect(bazz).not.toBeNull();
    expect(bazz?.baz.bar.foo).toBe(5);
    expect(bazz?.baz.foo.bar).toBe('bar');
    bazz?.fooz.xxx
      .pipe(filter((x): x is string => x != null))
      .subscribe((v) => expect(v).toBe('yyy'));
    diContainer.endScope();
  });
});
