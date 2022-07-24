import { documentKey } from '../../../di/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '../../constants';
import { RexarTag } from './rexar-tag';
import { IRenderable } from '../@types/IRenderable';
import { RenderKind } from '../@types/RenderableType';
import { endScope, register, resolve, startScope } from '../../di/di-container';

describe('rexar-tags', () => {
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
  test('resolve document', () => {
    const document = resolve<Document>(documentKey);
    expect(document).not.toBeUndefined();
    expect(document).not.toBeNull();
  });
  test('simple tag', () => {
    const tag = new RexarTag('div', { foo: 'bar' });
    expect((tag as IRenderable).kind).toBe(RenderKind.Static);
    const div = tag.render();
    expect(div.nodeName).toBe('DIV');
    expect(div.getAttribute('foo')).toBe('bar');
  });
});
