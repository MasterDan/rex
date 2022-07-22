import { documentKey } from '@/di/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '@/next/constants';
import { register, startScope, endScope } from '@/next/di/di-container';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarTagWithChildren } from '@/next/render/nodes/rexar-tag.with-children';
import { RexarContainer } from './rexar-container';

describe('testing cotainer', () => {
  beforeAll(() => {
    const dom = new JSDOM();
    register({
      key: documentKey,
      value: dom.window.document,
      scope: testScope,
    });
    startScope(testScope);
  });
  afterAll(() => {
    endScope();
  });
  test('simple render', () => {
    const root = new RexarTagWithChildren(
      'div',
      { class: 'column' },
      new RexarContainer(new RexarTag('span', { role: 'placeholder' })),
    );
    const rendered = root.render();
    expect(rendered.outerHTML).toBe(
      '<div class="column"><span role="placeholder"></span></div>',
    );
  });
});
