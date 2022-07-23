import { documentKey } from '@/di/constants';
import { testScope } from '@/next/constants';
import { register, startScope, endScope } from '@/next/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarTag } from '../nodes/rexar-tag';
import { RexarTagWithChildren } from '../nodes/rexar-tag.with-children';
import { CompoundContainer } from './compound.container';
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
  test('empty vanish', () => {
    const vanishing = new VanishingContainer(new TagGroupContainer());
    const root = new RexarTagWithChildren('div', null, vanishing);
    const rendered = root.render();
    expect(rendered.outerHTML).toBe('<div></div>');
    vanishing.vanish();
    expect(rendered.outerHTML).toBe('<div></div>');
    vanishing.inject();
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
  test('multi vanish', () => {
    const vanishingOne = new VanishingContainer(
      new TagGroupContainer(new RexarTag('div', { id: 'first' })),
    );
    const vanishingTwo = new VanishingContainer(
      new TagGroupContainer(
        new RexarTag('div', { id: 'second' }),
        new RexarTag('span', { role: 'second' }),
      ),
    );
    const vanishingThree = new VanishingContainer(
      new TagGroupContainer(new RexarTag('div', { id: 'third' })),
    );
    const root = new RexarTagWithChildren(
      'div',
      null,
      new CompoundContainer(vanishingOne, vanishingTwo, vanishingThree),
    );
    const rendered = root.render();
    // remove 2, 1, 3
    expect(rendered.outerHTML).toBe(
      '<div><div id="first"></div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
    vanishingTwo.vanish();
    expect(rendered.outerHTML).toBe(
      '<div><div id="first"></div><div id="third"></div></div>',
    );
    vanishingOne.vanish();
    expect(rendered.outerHTML).toBe('<div><div id="third"></div></div>');
    vanishingThree.vanish();
    expect(rendered.outerHTML).toBe('<div></div>');
    // inject 2, 3, 1
    vanishingTwo.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div id="second"></div><span role="second"></span></div>',
    );
    vanishingThree.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
    vanishingOne.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div id="first"></div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
    // remove 1, 2, 3
    vanishingOne.vanish();
    expect(rendered.outerHTML).toBe(
      '<div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
    vanishingTwo.vanish();
    expect(rendered.outerHTML).toBe('<div><div id="third"></div></div>');
    vanishingThree.vanish();
    expect(rendered.outerHTML).toBe('<div></div>');
    // inject 3, 2, 1
    vanishingThree.inject();
    expect(rendered.outerHTML).toBe('<div><div id="third"></div></div>');
    vanishingTwo.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
    vanishingOne.inject();
    expect(rendered.outerHTML).toBe(
      '<div><div id="first"></div><div id="second"></div><span role="second"></span><div id="third"></div></div>',
    );
  });
});
