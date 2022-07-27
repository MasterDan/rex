import { PipelineContainer } from './pipeline.container';
import { RexarTemplate } from '../renderable/rexar-template';
import { RexarTag } from '../renderable/rexar-tag';
import { VanishingContainer } from './vanishing.container';
import { MultiplierContainer } from './multiplier.container';
import { RexarTagWithChildren } from '../renderable/rexar-tag.with-children';
import { documentKey, testScope } from '@/constants';
import { register, startScope, endScope } from '@/di/di-container';
import { JSDOM } from 'jsdom';

describe('pipeline container', () => {
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
  test('combine vanish and multiply', () => {
    let vanish: VanishingContainer | null = null;
    let multiply: MultiplierContainer | null = null;
    const pipeline = new PipelineContainer(
      new RexarTemplate(new RexarTag('div', { class: 'foo' })),
      (t) => {
        vanish = new VanishingContainer(t);
        return vanish;
      },
      (t) => {
        multiply = new MultiplierContainer(t, 3);
        return multiply;
      },
    );
    const root = new RexarTagWithChildren('div', null, pipeline);
    const render = root.render();
    expect(render.outerHTML).toBe(
      '<div><div class="foo"></div><div class="foo"></div><div class="foo"></div></div>',
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    vanish!.vanish();
    expect(render.outerHTML).toBe('<div></div>');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    vanish!.inject();
    expect(render.outerHTML).toBe(
      '<div><div class="foo"></div><div class="foo"></div><div class="foo"></div></div>',
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    multiply!.repeat$.next(5);
    expect(render.outerHTML).toBe(
      '<div><div class="foo"></div><div class="foo"></div><div class="foo"></div><div class="foo"></div><div class="foo"></div></div>',
    );
  });
});
