type TupleToObject<T extends readonly (string | number | symbol)[]> = {
  [Prop in T[number]]: Prop
}
