type MyPick<T, K extends keyof T> = {
  [Prop in K]: T[Prop]
}
