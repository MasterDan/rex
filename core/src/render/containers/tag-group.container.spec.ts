import { documentKey } from '@/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '../../constants';
import { register, startScope, endScope } from '@/di/di-container';
import { RexarTag } from '../renderable/rexar-tag';
import { RexarTagWithChildren } from '../renderable/rexar-tag.with-children';
import { TagGroupContainer } from './tag-group.container';

describe('tag-group', () => {
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
  test('simple render group', () => {
    const root = new RexarTagWithChildren(
      'div',
      { class: 'row' },
      new TagGroupContainer(
        new RexarTag('span', { role: 'placeholder' }),
        new RexarTag('div', { class: 'column' }),
      ),
    );
    const rendered = root.render();
    expect(rendered.outerHTML).toBe(
      '<div class="row"><span role="placeholder"></span><div class="column"></div></div>',
    );
  });
});
