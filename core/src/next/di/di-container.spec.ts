import { filter, Observable } from 'rxjs';
import { testScope } from '../constants';
import {
  endScope,
  register,
  resolve,
  scoped,
  startScope,
} from './di-container';
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
    const fooResolved = resolve<Foo>('foo');
    expect(fooResolved.bar).toBe('bar');
  });
  test("resolve bar by it's type", () => {
    const bar = resolve(Bar);
    expect(bar.foo).toBe(5);
  });
  test('create Baz that resolves from Di', () => {
    const baz = resolve<Baz>(Baz);
    expect(baz.foo.bar).toBe('bar');
    expect(baz.bar.foo).toBe(5);
  });
  test('resolve reactive', () => {
    const fooz = resolve(Fooz);
    expect(fooz).not.toBeNull();
    fooz.xxx.pipe(filter((x): x is string => x != null)).subscribe((v) => {
      expect(v).toBe('yyy');
    });
    register<string>({
      key: 'xxx',
      reactive: 'yyy',
    });
  });
  test('complex resolve', () => {
    const bazz = resolve(Bazz);
    expect(bazz.baz.bar.foo).toBe(5);
    expect(bazz.baz.foo.bar).toBe('bar');
    bazz.fooz.xxx
      .pipe(filter((x): x is string => x != null))
      .subscribe((v) => expect(v).toBe('yyy'));
  });
  test('complex resolve Scoped', () => {
    scoped(testScope, () => {
      const bazz = resolve(BazzScoped);
      expect(bazz.baz.bar.foo).toBe(5);
      expect(bazz.baz.foo.bar).toBe('bar');
      bazz.fooz.xxx
        .pipe(filter((x): x is string => x != null))
        .subscribe((v) => expect(v).toBe('yyy'));
    });
  });
  test('singleTon resolve', () => {
    const baz = resolve(Baz);
    expect(baz.bar.single.counter).toBe(0);
    baz.bar.single.counter++;
    expect(baz.bar.single.counter).toBe(1);
    expect(baz.foo.single.counter).toBe(1);
    baz.bar.single.counter = 0;
    expect(baz.foo.single.counter).toBe(0);
  });
  test('singleTon resolve in spec', () => {
    const baz = resolve(Baz);
    expect(baz.bar.single.counter).toBe(0);

    baz.bar.single.counter++;
    expect(baz.bar.single.counter).toBe(1);
    expect(baz.foo.single.counter).toBe(1);

    startScope(testScope);

    const bazz = resolve(BazzScoped);
    expect(bazz).not.toBeNull();
    expect(bazz.baz.bar.single.counter).toBe(1);

    endScope();

    baz.bar.single.counter--;
    expect(bazz?.baz.bar.single.counter).toBe(0);
  });
});
