import { filter, Observable } from 'rxjs';
import { testScope } from '../constants';
import { diContainer } from './di-container';
import { Resolvable } from './resolvable.decorator';

@Resolvable({ singletone: true })
class Single {
  counter = 0;
}

@Resolvable({ key: 'foo', dependencies: [Single] })
class Foo {
  constructor(public single: Single) {}

  bar = 'bar';
}

@Resolvable({ dependencies: [Single] })
class Bar {
  constructor(public single: Single) {}

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
  test('singleTon resolve', () => {
    const baz = diContainer.resolve(Baz);
    expect(baz).not.toBeNull();
    expect(baz?.bar.single.counter).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baz!.bar.single.counter++;
    expect(baz?.bar.single.counter).toBe(1);
    expect(baz?.foo.single.counter).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baz!.bar.single.counter = 0;
    expect(baz?.foo.single.counter).toBe(0);
  });
  test('singleTon resolve in spec', () => {
    const baz = diContainer.resolve(Baz);
    expect(baz).not.toBeNull();
    expect(baz?.bar.single.counter).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baz!.bar.single.counter++;
    expect(baz?.bar.single.counter).toBe(1);
    expect(baz?.foo.single.counter).toBe(1);
    diContainer.startScope(testScope);
    const bazz = diContainer.resolve(BazzScoped);
    expect(bazz).not.toBeNull();
    expect(bazz?.baz.bar.single.counter).toBe(1);
    diContainer.endScope();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    baz!.bar.single.counter--;
    expect(bazz?.baz.bar.single.counter).toBe(0);
  });
});
