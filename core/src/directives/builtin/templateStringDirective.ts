import { Ref } from 'core/src/scope/ref';
import { RexNode } from 'core/src/vdom/rexNode';
import {
  combineLatest,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Directive } from '../directive';
import {
  getKeysToInsert,
  parseTemplateString,
} from '../stringParser/stringParser';

export class TemplateStringDirective extends Directive {
  name = '__template_String__';

  constructor(private childIndex: number | null = null) {
    super();
  }

  override init(node: RexNode): RexNode | RexNode[] {
    console.log('initializing for child', this.childIndex);

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
          console.log('template string', strToRepl);
          const keys = getKeysToInsert(strToRepl);
          console.log('keys', keys);
          const resolved = keys.map((key) =>
            this.resolveReactive<Ref<string>>(key).pipe(
              switchMap((v) => v),
              tap((v) => {
                console.log('value for key', v);
              }),
              map((v) => (v == null ? '' : v)),
              map((value) => ({
                key,
                value,
              })),
            ),
          );
          return forkJoin({
            template: of(strToRepl),
            pairs: combineLatest(resolved).pipe(first()),
          });
        }),
        map((arg) => {
          console.log('arg', arg);
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
          const valueToModify = node.children$.value as string[];
          valueToModify[this.childIndex] = templateResult;
          node.children$.next(valueToModify);
        } else {
          console.log('parseText initialized', templateResult);
          node.children$.next(templateResult);
        }
      });
    return node;
  }
}
