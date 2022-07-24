export type Method<I, O> = (...args: I) => O;

export type Model = Record<string, Ref | Method>;
