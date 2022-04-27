export class RexNode {
  constructor(
    public tag: string,
    public attributes: Record<string, string> | null = null,
    public children: RexNode | RexNode[] | null = null,
  ) {}
}
