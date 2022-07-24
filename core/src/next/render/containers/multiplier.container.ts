import {
  BehaviorSubject,
  distinctUntilChanged,
  pairwise,
  Subject,
  takeUntil,
} from 'rxjs';
import { IRenderable } from '../@types/IRenderable';
import { CompoundContainer } from './compound.container';
import { RexarContainer } from './rexar-container';
import { VanishingContainer } from './vanishing.container';

export class MultiplierContainer extends RexarContainer {
  repeat$: BehaviorSubject<number>;

  unbindRepeatWatch$ = new Subject();

  body: CompoundContainer<VanishingContainer> | undefined;

  constructor(template: IRenderable, repeat = 1) {
    super(template);
    this.repeat$ = new BehaviorSubject<number>(repeat);
    this.wrapTemplate();
  }

  wrapTemplate() {
    if (this.template == undefined || this.repeat$.value === 0) {
      this.size$.next(0);
      return;
    }
    const wrappedTemplates: VanishingContainer[] = [];
    for (let i = 0; i < this.repeat$.value; i++) {
      wrappedTemplates.push(new VanishingContainer(this.template));
    }
    this.body = new CompoundContainer(...wrappedTemplates);
    this.binding$.subscribe((b) => this.body?.binding$.next(b));
    this.body.bindingOwn$.subscribe((b) => this.bindingOwn$.next(b));
  }

  public override inject(): void {
    if (
      this.template == undefined ||
      this.binding$.value == null ||
      this.repeat$.value === 0 ||
      this.body == undefined
    ) {
      this.size$.next(0);
      return;
    }
    this.body.inject();
    this.monitorRepeat();
  }

  monitorRepeat() {
    this.unbindRepeatWatch$.next(null);
    this.repeat$
      .pipe(
        takeUntil(this.unbindRepeatWatch$),
        distinctUntilChanged(),
        pairwise(),
      )
      .subscribe(([oldSize, newSize]) => {
        if (this.body == undefined) {
          return;
        }
        if (oldSize < newSize) {
          const diff = newSize - oldSize;
          const newContainers: VanishingContainer[] = [];
          for (let i = 0; i < diff; i++) {
            newContainers.push(new VanishingContainer(this.template));
          }
          this.body.children.push(...newContainers);
          this.body.bindChildern();
          for (const container of newContainers) {
            container.inject();
          }
        } else if (newSize < oldSize) {
          const diff = oldSize - newSize;
          let lasChildIndex = this.body.children.length - 1;
          for (let i = diff; i > 0; i--) {
            const child = this.body.children[lasChildIndex];
            child.vanish();
            lasChildIndex--;
          }
          const newChildren = this.body.children.slice(0, -diff);
          this.body.children = newChildren;
          this.body.bindChildern();
        }
      });
  }
}
