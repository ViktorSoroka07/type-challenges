type MyAwaited<T> = T extends { then: (onfulfilled: (arg: infer U) => any) => any } ? MyAwaited<U> : T
