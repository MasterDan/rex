import { documentKey } from '../../../di/constants';
import { JSDOM } from 'jsdom';
import { testScope } from '../../constants';
import { diContainer } from '../../di/container';
import { RexarTag } from './rexar-tag';

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
  test('simple tag', () => {
    const tag = new RexarTag('div', { foo: 'bar' });
    const div = tag.render();
    expect(div.nodeName).toBe('DIV');
    expect(div.getAttribute('foo')).toBe('bar');
  });
});
