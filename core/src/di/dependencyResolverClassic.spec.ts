import { DependencyResolverClassic } from './dependencyResolverClassic';
import { DiContainerClassic } from './diContainerClassic';

class TestResolverWrapper extends DependencyResolverClassic {
  foo = this.resolve<string>('foo');
  inner = this.resolve<TestResolver>('inner');
}

class TestResolver extends DependencyResolverClassic {
  foo = this.resolve<string>('foo');
  bar = this.resolve<string>('bar');
}

describe('classic dependecy resolver', () => {
  test('provide-resolve', () => {
    const foo = 'foo';
    const bar = 'bar';
    const resolver = new TestResolver();
    const di = new DiContainerClassic();
    di.register<string>(foo, 'foo');
    di.register<string>(bar, 'bar');
    di.register<TestResolver>(resolver, 'resolver');
    const resolved = di.resolve<TestResolver>('resolver');
    expect(resolved).not.toBe(null);
    const fooSub = jest.fn((foo) => {
      expect(foo).toBe('foo');
    });
    const barSub = jest.fn((bar) => {
      expect(bar).toBe('bar');
    });
    resolved?.foo.subscribe(fooSub);
    resolved?.bar.subscribe(barSub);
    expect(fooSub).toBeCalled();
    expect(barSub).toBeCalled();
  });
  test('resolve resolver classic', () => {
    const foo = 'foo';
    const bar = 'bar';
    const resolver = new TestResolver();
    const wrapper = new TestResolverWrapper();
    const di = new DiContainerClassic();
    di.register<string>(foo, 'foo');
    di.register<string>(bar, 'bar');
    di.register<TestResolver>(resolver, 'inner');
    di.register<TestResolverWrapper>(wrapper, 'wrapper');
    const resolved = di.resolve<TestResolverWrapper>('wrapper');
    expect(resolved).not.toBe(undefined);
    expect(resolved?.hasContainer).toBe(true);
    expect(resolved?.inner).not.toBe(undefined);

    const fooSub = jest.fn((foo) => {
      expect(foo).toBe('foo');
    });
    const barSub = jest.fn((bar) => {
      expect(bar).toBe('bar');
    });
    const subInner = jest.fn((arg: TestResolver | undefined) => {
      expect(arg?.hasContainer).toBe(true);
      arg?.foo.subscribe(fooSub);
      arg?.bar.subscribe(barSub);
    });
    resolved?.foo.subscribe(fooSub);
    resolved?.inner?.subscribe(subInner);

    expect(subInner).toBeCalled();
    expect(fooSub).toBeCalled();
    expect(barSub).toBeCalled();
  });
});
