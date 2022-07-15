import { diContainer } from './container';
import { Provide } from './provide.decorator';

@Provide('foo')
class Foo {
  bar = 'bar';
}

describe('provide', () => {
  test('provide foo', () => {
    const _foo = new Foo();
    const fooResolved = diContainer.resolveCtor<Foo>('foo');
    expect(fooResolved.bar).toBe('bar');
  });
});
