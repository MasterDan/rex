import { documentKey, testScope } from '@/constants';
import { register, startScope, endScope } from '@/di/di-container';
import { JSDOM } from 'jsdom';
import { RexarContainer } from '../containers/rexar-container';
import { FragmentTemplate } from './fragment.template';
import { RexarString } from './rexar-string';
import { RexarTag } from './rexar-tag';
import { RexarTagWithChildren } from './rexar-tag.with-children';
import { RexarTemplate } from './rexar-template';

describe('fragment template', () => {
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
      null,
      new RexarContainer(
        new FragmentTemplate(
          new RexarContainer(
            new RexarTemplate(
              new RexarTag('span'),
              new RexarString('Yaaay'),
              new RexarTag('div'),
            ),
          ),
        ),
      ),
    );
    const render = root.render();
    expect(render.outerHTML).toBe('<div><span></span>Yaaay<div></div></div>');
  });
});
