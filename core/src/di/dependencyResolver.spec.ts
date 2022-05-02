import { DependencyResolver } from './dependencyResolver';
import { DiContainer } from './diContainer';

class Resolver extends DependencyResolver {
  foo = this.resolve<string>('foo');
  bar = this.resolveReactive<string>('bar');
}

describe('dependency resolver mixed', () => {
  test('simple resolve', () => {
    const di = new DiContainer();
    const resolver = new Resolver();
    di.register<Resolver>(resolver, 'r');
    di.registerReactive<string>('bar', 'bar');
    di.register<string>('foo', 'foo');
    const resolvedResolver = di.resolve<Resolver>('r');
    expect(resolvedResolver).not.toBe(undefined);
    const fooSub = jest.fn((f) => {
      expect(f).toBe('foo');
    });
    const barSub = jest.fn((f) => {
      expect(f).toBe('bar');
    });
    resolvedResolver?.foo?.subscribe(fooSub);
    resolvedResolver?.bar?.subscribe(barSub);
    expect(fooSub).toBeCalled();
    // scope
    const scopedDi = di.clone().createScope.classic();
    scopedDi.register<string>('foo', 'fooo');
    const fooScoped = scopedDi.resolve<string>('foo');
    expect(fooScoped).toBe('fooo');
    const resolvedFromScope = scopedDi.resolve<Resolver>('r');
    expect(resolvedFromScope).not.toBe(undefined);
    const fooSubScoped = jest.fn((f) => {
      expect(f).toBe('fooo');
    });
    resolvedFromScope?.foo.subscribe(fooSubScoped);
    expect(fooSubScoped).toBeCalled();
  });
});
