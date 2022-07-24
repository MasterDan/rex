import { documentKey } from '@/di/constants';
import { testScope } from '@/next/constants';
import { register, startScope, endScope } from '@/next/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarTag } from '../renderable/rexar-tag';
import { RexarTagWithChildren } from '../renderable/rexar-tag.with-children';
import { MultiplierContainer } from './multiplier.container';

describe('multiplier container', () => {
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
  test('repeat siple div', () => {
    const multi = new MultiplierContainer(
      new RexarTag('div', { foo: 'bar' }),
      3,
    );
    const root = new RexarTagWithChildren('div', null, multi);
    const rendered = root.render();
    expect(rendered.outerHTML).toBe(
      '<div><div foo="bar"></div><div foo="bar"></div><div foo="bar"></div></div>',
    );
    multi.repeat$.next(1);
    expect(rendered.outerHTML).toBe('<div><div foo="bar"></div></div>');
    multi.repeat$.next(4);
    expect(rendered.outerHTML).toBe(
      '<div><div foo="bar"></div><div foo="bar"></div><div foo="bar"></div><div foo="bar"></div></div>',
    );
    multi.repeat$.next(0);
    expect(rendered.outerHTML).toBe('<div></div>');
    multi.repeat$.next(2);
    expect(rendered.outerHTML).toBe(
      '<div><div foo="bar"></div><div foo="bar"></div></div>',
    );
  });
});
