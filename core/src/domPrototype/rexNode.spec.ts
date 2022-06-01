import { RexNode } from './rexNode';

describe('rexNode', () => {
  test('draw div', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      'lorem ipsum',
      ' dolor',
    ]);
    const sub = jest.fn((value: string) => {
      expect(value).toBe('<div class="foo-bar">lorem ipsum dolor</div>');
    });
    rexNode.text$.subscribe(sub);
    expect(sub).toBeCalled();
  });
  test('draw many', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      new RexNode('div', { class: 'foo-baz' }),
      new RexNode('div', { class: 'foo-baz' }),
    ]);
    const sub = jest.fn((value: string) => {
      expect(value).toBe(
        '<div class="foo-bar"><div class="foo-baz"></div><div class="foo-baz"></div></div>',
      );
    });
    rexNode.text$.subscribe(sub);
    expect(sub).toBeCalled();
  });
  test('draw empty', () => {
    const rexNode = new RexNode('', { class: 'foo-bar' }, [
      new RexNode('div', { class: 'foo-baz' }),
      new RexNode('div', { class: 'foo-baz' }),
    ]);
    const sub = jest.fn((value: string) => {
      expect(value).toBe(
        '<div class="foo-baz"></div><div class="foo-baz"></div>',
      );
    });
    rexNode.text$.subscribe(sub);
    expect(sub).toBeCalled();
  });
  test('test string concat', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      'lorem ipsum',
      ' dolor',
    ]);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(rexNode.children$.value![0]).toEqual('lorem ipsum dolor');
  });
  test('more complex string concat', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      'lorem ipsum',
      ' dolor',
      new RexNode('div'),
      'lorem ipsum ',
      'dolor',
    ]);
    expect((rexNode.children$.value as string[]).length).toEqual(3);
    expect((rexNode.children$.value as string[])[0]).toEqual(
      'lorem ipsum dolor',
    );
    expect((rexNode.children$.value as string[])[2]).toEqual(
      'lorem ipsum dolor',
    );
  });
  test('compare two nodes', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, ['lorem ipsum']);
    const cloned = rexNode.clone();
    expect(cloned.compare(rexNode)).toBe(true);
  });
});
