import { documentKey } from '../../../di/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '../../constants';
import { diContainer } from '../../di/di-container';
import { RexarTag } from './rexar-tag';
import { IRenderable } from '../@types/IRenderable';
import { RenderKind } from '../@types/RenderableType';

describe('rexar-tags', () => {
  beforeAll(() => {
    const dom = new JSDOM();
    diContainer.register({
      key: documentKey,
      value: dom.window.document,
      scope: testScope,
    });
    diContainer.startScope(testScope);
  });
  afterAll(() => {
    diContainer.endScope();
  });
  test('resolve dovument', () => {
    const document = diContainer.resolve<Document>(documentKey);
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
