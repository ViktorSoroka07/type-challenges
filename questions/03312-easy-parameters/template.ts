type MyParameters<T extends (...args: any[]) => any> = T extends (...args: (infer U)) => any ? U : never
