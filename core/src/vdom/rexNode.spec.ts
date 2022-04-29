import { RexNode } from './rexNode';

describe('rexNode', () => {
  test('drawDiv', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' });
    expect(rexNode.text$.value).toBe('<div class="foo-bar" ></div>');
  });
  test('drawMany', () => {
    const rexNode = new RexNode('div', { class: 'foo-bar' }, [
      new RexNode('div', { class: 'foo-baz' }),
      new RexNode('div', { class: 'foo-baz' }),
    ]);
    expect(rexNode.text$.value).toBe(
      '<div class="foo-bar" ><div class="foo-baz" ></div><div class="foo-baz" ></div></div>',
    );
  });
});
