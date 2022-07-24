import { documentKey, testScope } from '@/constants';
import { register, startScope, endScope } from '@/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarTag } from '../renderable/rexar-tag';
import { RexarTagWithChildren } from '../renderable/rexar-tag.with-children';
import { RexarContainer } from './rexar-container';
import { CompoundContainer } from './compound.container';
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
      new CompoundContainer(
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
