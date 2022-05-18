import { Ref } from 'core/src/scope/ref';
import { RexNode } from 'core/src/vdom/rexNode';
import {
  combineLatest,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';
import { Directive } from '../directive';
import {
  getKeysToInsert,
  parseTemplateString,
} from '../stringParser/stringParser';

export const templateStringDirName = '__template_String__';
export class TemplateStringDirective extends Directive {
  name = templateStringDirName;
  childIndex: number | null = null;

  override init(node: RexNode): RexNode | RexNode[] {
    node.children$
      .pipe(
        map((val) => {
          if (this.childIndex == null && typeof val === 'string') {
            return val;
          } else if (this.childIndex != null && Array.isArray(val)) {
            return val[this.childIndex] ?? null;
          }
        }),
        filter(
          (strToRepl): strToRepl is string =>
            strToRepl != null && typeof strToRepl === 'string',
        ),
        switchMap((strToRepl) => {
          const keys = getKeysToInsert(strToRepl);
          const resolved = keys.map((key) =>
            this.resolveReactive<Ref<string>>(key).pipe(
              switchMap((v) => v),
              map((v) => (v == null ? '' : v)),
              map((value) => ({
                key,
                value,
              })),
            ),
          );
          return forkJoin({
            template: of(strToRepl),
            pairs: combineLatest(resolved).pipe(take(1)),
          });
        }),
        map((arg) => {
          const acc: Record<string, string> = {};
          for (const pair of arg.pairs) {
            acc[pair.key] = pair.value;
          }
          return {
            template: arg.template,
            state: acc,
          };
        }),
      )
      .subscribe((arg) => {
        const templateResult = parseTemplateString(arg.template, arg.state);
        if (this.childIndex != null) {
          node.children$.mutate((array) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            (array as string[])[this.childIndex!] = templateResult;
            return array;
          });
        } else {
          node.children$.next(templateResult);
        }
      });
    return node;
  }
}
