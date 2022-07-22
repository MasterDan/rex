import { documentKey } from '@/di/constants';
import { testScope } from '@/next/constants';
import { register, startScope, endScope } from '@/next/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarTagWithChildren } from '../nodes/rexar-tag.with-children';
import { RexarContainer } from './rexar-container';
import { RexarCompoundContainer } from './rexar-compound.container';
import { TagGroupContainer } from './tag-group.container';

describe('compound container', () => {
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
    const tree = new RexarTagWithChildren(
      'div',
      null,
      new RexarCompoundContainer(
        new RexarContainer(new RexarTag('span')),
        new TagGroupContainer(new RexarTag('div'), new RexarTag('span')),
      ),
    );
    const rendered = tree.render();
    expect(rendered.outerHTML).toBe(
      '<div><span></span><div></div><span></span></div>',
    );
  });
});
