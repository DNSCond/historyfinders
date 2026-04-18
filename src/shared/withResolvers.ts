// withResolvers
export function withResolvers<T>(): {
    promise: Promise<T>,
    resolve: (value: (PromiseLike<T> | T)) => void,
    reject: (reason?: any) => void,
} {
    let resolve: (value: (PromiseLike<T> | T)) => void, reject: (reason?: any) => void;
    const promise = new Promise<T>((res: (value: (PromiseLike<T> | T)) => void, rej: (reason?: any) => void) => {
        resolve = res;
        reject = rej;
    }); // @ts-expect-error
    return {promise, resolve, reject};
}
