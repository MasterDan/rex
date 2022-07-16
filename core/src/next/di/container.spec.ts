import { diContainer } from './container';
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
});
