import { DependencyResolver } from '../di/dependencyResolver';
import { RexNode } from '../vdom/rexNode';
import { getKeysToInsert } from './stringParser/stringParser';
import { TemplateStringDirective } from './builtin/templateStringDirective';

export class DirectiveDetector extends DependencyResolver {
  findStringTemplates(node: RexNode): void {
    if (
      node.children$.value == null ||
      node.children$.value instanceof RexNode
    ) {
      return;
    } else if (typeof node.children$.value === 'string') {
      const keys = getKeysToInsert(node.children$.value);
      if (keys.length > 0) {
        node._addDirective(new TemplateStringDirective());
      }
    } else if (Array.isArray(node.children$.value)) {
      for (const key in node.children$.value) {
        const current = node.children$.value[key];
        if (typeof current === 'string') {
          const keys = getKeysToInsert(current);
          if (keys.length > 0) {
            node._addDirective(new TemplateStringDirective(+key));
          }
        }
      }
    }
  }
}
