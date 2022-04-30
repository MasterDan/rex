import { RexNode } from './rexNode';

describe('rexNode', () => {
  test('drawDiv', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' });
    const sub = jest.fn((value: string) => {
      expect(value).toBe('<div class="foo-bar" ></div>');
    });
    rexNode.text$.subscribe(sub);
    expect(sub).toBeCalled();
  });
  test('drawMany', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      new RexNode('div', { class: 'foo-baz' }),
      new RexNode('div', { class: 'foo-baz' }),
    ]);
    const sub = jest.fn((value: string) => {
      expect(value).toBe(
        '<div class="foo-bar" ><div class="foo-baz" ></div><div class="foo-baz" ></div></div>',
      );
    });
    rexNode.text$.subscribe(sub);
    expect(sub).toBeCalled();
  });
});
