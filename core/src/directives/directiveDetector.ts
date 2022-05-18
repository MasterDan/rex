import { DependencyResolver } from '../di/dependencyResolver';
import { RexNode } from '../vdom/rexNode';
import { getKeysToInsert } from './stringParser/stringParser';
import {
  TemplateStringDirective,
  templateStringDirName,
} from './builtin/templateStringDirective';
import { Directive } from './directive';
import { filter, Observable, take } from 'rxjs';

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
        this.resolveDirective<TemplateStringDirective>(
          templateStringDirName,
        ).subscribe((dir) => {
          node._addDirective(dir);
        });
      }
    } else if (Array.isArray(node.children$.value)) {
      for (const key in node.children$.value) {
        const current = node.children$.value[key];
        if (typeof current !== 'string') {
          continue;
        }
        const keys = getKeysToInsert(current);
        if (keys.length > 0) {
          this.resolveDirective<TemplateStringDirective>(
            templateStringDirName,
          ).subscribe((dir) => {
            dir.childIndex = +key;
            node._addDirective(dir);
          });
        }
      }
    }
  }

  private resolveDirective<T extends Directive>(name: string): Observable<T> {
    return this.resolve<Directive>(name).pipe(
      filter((dir): dir is T => dir != null),
      take(1),
    );
  }
}
