import { documentKey } from '@/di/constants';
import { testScope } from '@/next/constants';
import { register, startScope, endScope } from '@/next/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarTagWithChildren } from '../nodes/rexar-tag.with-children';
import { TagGroupContainer } from './tag-group.container';
import { VanishingContainer } from './vanishing.container';

describe('vanishing container', () => {
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
  test('simple vanish', () => {
    const vanishing = new VanishingContainer(
      new TagGroupContainer(
        new RexarTag('div'),
        new RexarTag('span'),
        new RexarTag('div'),
      ),
    );
    const root = new RexarTagWithChildren('div', null, vanishing);
    const rendered = root.render();
    expect(rendered.outerHTML).toBe(
      '<div><div></div><span></span><div></div></div>',
    );
    vanishing.vanish();
    expect(rendered.outerHTML).toBe('<div></div>');
    vanishing.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div></div><span></span><div></div></div>',
    );
  });
});
