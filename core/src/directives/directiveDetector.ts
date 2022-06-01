import { DependencyResolver } from '../di/dependencyResolver';
import { RexNode } from '../domPrototype/rexNode';
import { getKeysToInsert } from './stringParser/stringParser';
import {
  TemplateStringDirective,
  templateStringDirName,
} from './builtin/templateStringDirective';
import { Directive } from './directive';
import { combineLatest, map, Observable, switchMap, take } from 'rxjs';
import { registeredDirectiveNamesKey } from '../di/constants';

export class DirectiveDetector extends DependencyResolver {
  scanNode(node: RexNode): void {
    this.findStringTemplates(node);
    this.findClassicDirectives(node);
  }

  private findStringTemplates(node: RexNode): void {
    if (
      node.children$.value == null ||
      node.children$.value instanceof RexNode
    ) {
      return;
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
            node.__addDirective(dir);
          });
        }
      }
    }
  }

  private findClassicDirectives(node: RexNode): void {
    this.resolve<string[]>(registeredDirectiveNamesKey)
      .pipe(
        switchMap((keys) =>
          combineLatest(
            keys
              .filter((key) => key !== templateStringDirName)
              .map((key) => this.resolveDirective(key)),
          ).pipe(take(1)),
        ),
        map((dirs) =>
          dirs
            .map((dir) => dir.__detectSelfIn(node))
            .filter((arg): arg is Directive[] => arg != null),
        ),
        map((dirs) =>
          dirs.length > 0 ? dirs.reduce((a, b) => a.concat(b)) : (dirs as []),
        ),
      )
      .subscribe((dirs) => {
        node.__addDirective(...dirs);
      });
  }

  private resolveDirective<T extends Directive>(name: string): Observable<T> {
    return this.resolve<T>(name);
  }
}
