import { Component } from '../../component/component';
import { JsDomPlugin } from '../../plugins/jsDomPlugin';
import { Ref } from '../../scope/ref';
import { RexNode } from '../../domPrototype/rexNode';
import { RexApp } from '../../app/app';

describe('template string directive', () => {
  test('Simple Component', () => {
    const word = new Ref('Danny');
    const rootComponent = new Component({
      render: new RexNode('div', null, 'Hello, {{ word }}'),
      setup() {
        return {
          word,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">Hello, Danny<\/div><\/div>/gm,
    );
    word.next('World');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">Hello, World<\/div><\/div>/gm,
    );
  });
  test('Div with array of children', () => {
    const foo = new Ref('fizz');
    const bar = new Ref('buzz');
    const rootComponent = new Component({
      render: new RexNode('div', null, [
        '{{ foo }}',
        new RexNode('span', null, '-'),
        '{{ bar }}',
      ]),
      setup() {
        return {
          foo,
          bar,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">fizz<span>-<\/span>buzz<\/div><\/div>/gm,
    );
    foo.next('foo');
    bar.next('bar');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">foo<span>-<\/span>bar<\/div><\/div>/gm,
    );
  });
  test('Div with span with template', () => {
    const foo = new Ref('fizz');
    const bar = new Ref('buzz');
    const rootComponent = new Component({
      render: new RexNode('div', null, [
        '{{ foo }}',
        new RexNode('span', null, '{{ bar }}'),
      ]),
      setup() {
        return {
          foo,
          bar,
        };
      },
    });
    const jsDom = new JsDomPlugin('<div id="rexApp" ></div>');
    new RexApp(rootComponent).extend(jsDom).mount('#rexApp');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">fizz<span --rex--anchor=".*">buzz<\/span><\/div><\/div>/gm,
    );
    foo.next('foo');
    bar.next('bar');
    expect(jsDom.dom.window.document.body.innerHTML).toMatch(
      /<div id="rexApp"><div --rex--anchor=".*">foo<span --rex--anchor=".*">bar<\/span><\/div><\/div>/gm,
    );
  });
});
