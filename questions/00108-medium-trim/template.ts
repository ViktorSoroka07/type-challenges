type WhiteSpace = ' ' | '\n' | '\t'
type TrimStart<S extends string> = S extends `${WhiteSpace}${infer Rest}` ? TrimStart<Rest> : S
type TrimEnd<S extends string> = S extends `${infer Rest}${WhiteSpace}` ? TrimEnd<Rest> : S

type Trim<S extends string> = TrimStart<TrimEnd<S>>
