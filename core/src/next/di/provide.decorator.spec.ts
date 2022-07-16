import { diContainer } from './container';

@ToString
class Foo {
  bar = 'bar';
}

type Consturctor = { new (...args: any[]): any };

function ToString<T extends Consturctor>(BaseClass: T) {
  return class extends BaseClass {
    toString() {
      return JSON.stringify(this);
    }
  };
}

describe('provide', () => {
  test('decorator test', () => {
    const foo = new Foo();
    expect(foo.toString()).toBe('{"bar":"bar"}');
  });
  test('provide foo', () => {
    // const _foo = new Foo();
    const fooResolved = diContainer.resolveCtor<Foo>('foo');
    expect(fooResolved.bar).toBe('bar');
  });
});
