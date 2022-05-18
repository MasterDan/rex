import { filter } from 'rxjs';
import { DependencyResolverReactive } from './dependencyResolverReactive';
import { DiContainerReactive } from './diContainerReactive';

class TestDrrWrapper extends DependencyResolverReactive {
  foo = this.resolveReactive<string>('foo');
  inner = this.resolveReactive<TestDrr>('inner');
}

class TestDrr extends DependencyResolverReactive {
  foo = this.resolveReactive<string>('foo');
  bar = this.resolveReactive<string>('bar');
}

describe('reactive dependecyResolver', () => {
  test('provide-resolve', () => {
    const foo = 'foo';
    const bar = 'bar';
    const resolver = new TestDrr();
    const di = new DiContainerReactive();
    di.registerReactive<string>(foo, 'foo');
    di.registerReactive<string>(bar, 'bar');
    di.registerReactive<TestDrr>(resolver, 'resolver');
    const resolved$ = di.resolveReactive<TestDrr>('resolver');
    const fooSub = jest.fn((foo) => {
      expect(foo).toBe('foo');
    });
    const barSub = jest.fn((bar) => {
      expect(bar).toBe('bar');
    });
    const sub = jest.fn((arg: TestDrr) => {
      arg.foo.subscribe(fooSub);
      arg.bar.subscribe(barSub);
    });
    resolved$.pipe(filter((v): v is TestDrr => v != null)).subscribe(sub);
    expect(sub).toBeCalled();
    expect(fooSub).toBeCalled();
    expect(barSub).toBeCalled();
  });
  test('resolve resolver', () => {
    const foo = 'foo';
    const bar = 'bar';
    const resolver = new TestDrr();
    const wrapper = new TestDrrWrapper();
    const di = new DiContainerReactive();
    di.registerReactive<string>(foo, 'foo');
    di.registerReactive<string>(bar, 'bar');
    di.registerReactive<TestDrr>(resolver, 'inner');
    di.registerReactive<TestDrrWrapper>(wrapper, 'wrapper');
    const resolved$ = di.resolveReactive<TestDrrWrapper>('wrapper');
    const fooSub = jest.fn((foo) => {
      expect(foo).toBe('foo');
    });
    const barSub = jest.fn((bar) => {
      expect(bar).toBe('bar');
    });
    const subInner = jest.fn((arg: TestDrr) => {
      arg.foo.subscribe(fooSub);
      arg.bar.subscribe(barSub);
    });
    const sub = jest.fn((arg: TestDrrWrapper) => {
      expect(arg.hasContainer).toBe(true);
      arg.foo.subscribe(fooSub);
      arg.inner.subscribe(subInner);
    });
    resolved$
      .pipe(filter((v): v is TestDrrWrapper => v != null))
      .subscribe(sub);
    expect(sub).toBeCalled();
    expect(subInner).toBeCalled();
    expect(fooSub).toBeCalled();
    expect(barSub).toBeCalled();
  });
});
