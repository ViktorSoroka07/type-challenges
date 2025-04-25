type MyReadonly<T> = {
  readonly [Prop in keyof T]: T[Prop]
}
