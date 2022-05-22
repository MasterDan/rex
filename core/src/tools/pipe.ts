type Operator<X = unknown, Y = unknown> = (arg: X) => Y;

class Pipeline<X, Y> {
  private members: Operator<unknown, unknown>[] = [];
  constructor(arg: Operator<X, Y>) {
    this.members.push(arg as Operator<unknown, unknown>);
  }

  then<Z>(arg: Operator<Y, Z>): Pipeline<X, Z> {
    this.members.push(arg as Operator<unknown, unknown>);
    return this as unknown as Pipeline<X, Z>;
  }

  run(arg?: X): Y {
    let operatorResult: unknown = null;
    for (const operator of this.members) {
      operatorResult = operator(operatorResult ?? arg);
    }
    return operatorResult as Y;
  }
}

export function pipeIt<X = unknown, Y = unknown>(
  arg: Operator<X, Y>,
): Pipeline<X, Y> {
  return new Pipeline<X, Y>(arg);
}
