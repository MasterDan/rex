import { documentKey } from '@/di/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '@/constants';
import { register, startScope, endScope } from '@/di/di-container';
import { RexarTag } from '../renderable/rexar-tag';
import { RexarTagWithChildren } from '@/render/renderable/rexar-tag.with-children';
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
