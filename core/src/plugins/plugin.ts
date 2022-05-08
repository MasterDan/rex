import { DependencyProviderClassic } from '../di/dependencyProviderClassic';

export abstract class RexPlugin extends DependencyProviderClassic {
  abstract install(): void;
  constructor() {
    super();
    this.install();
  }
}
