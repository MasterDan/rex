import { diContainer } from './container';
import { Provide } from './provide.decorator';

@Provide('foo')
class Foo {
  bar = 'bar';
}

@Provide()
class Bar {
  foo = 5;
}
/* type Consturctor = { new (...args: any[]): any };

function ToString<T extends Consturctor>(BaseClass: T) {
  return class extends BaseClass {
    toString() {
      return JSON.stringify(this);
    }
  };
} */

describe('provide', () => {
  /*   test('decorator test', () => {
    const foo = new Foo();
    expect(foo.toString()).toBe('{"bar":"bar"}');
  }); */
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
});
