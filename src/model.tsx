// @ts-nocheck
import { models as rawModels } from '@/.plugin-model/model';
import { useContext, useEffect, useRef, useState, createContext } from 'react';
import isEqual from 'fast-deep-equal';

export class Dispatcher {
    //@ts-ignore
    callbacks: Record<Namespaces, Set<Function>> = {};
    //@ts-ignore
    data: Record<Namespaces, any> = {};
    update = (namespace: Namespaces) => {
        if (this.callbacks[namespace]) {
            this.callbacks[namespace].forEach((cb) => {
                try {
                    const data = this.data[namespace];
                    cb(data);
                } catch (e) {
                    cb(undefined);
                }
            });
        }
    };
}
export type Models = typeof rawModels;
//@ts-ignore
export const Context = createContext<{ dispatcher: Dispatcher }>(null);

type GetNamespaces<M> = {
    [K in keyof M]: M[K] extends { namespace: string }
    ? M[K]['namespace']
    : never;
}[keyof M];

export type Namespaces = GetNamespaces<Models>;

type GetModelByNamespace<M, N> = {
    [K in keyof M]: M[K] extends { namespace: string; model: unknown }
    ? M[K]['namespace'] extends N
    ? M[K]['model'] extends (...args: any) => any
    ? ReturnType<M[K]['model']>
    : never
    : never
    : never;
}[keyof M];

type Model<N> = GetModelByNamespace<Models, N>;
type Selector<N, S> = (model: Model<N>) => S;

type SelectedModel<N, T> = T extends (...args: any) => any
    ? ReturnType<NonNullable<T>>
    : Model<N>;

export function useModel<N extends Namespaces>(namespace: N): Model<N>;

export function useModel<N extends Namespaces, S>(
    namespace: N,
    selector: Selector<N, S>,
): SelectedModel<N, typeof selector>;

export function useModel<N extends Namespaces, S>(
    namespace: N,
    selector?: Selector<N, S>,
): SelectedModel<N, typeof selector> {

    const { dispatcher } = useContext<{ dispatcher: Dispatcher }>(Context);

    const selectorRef = useRef(selector);
    selectorRef.current = selector;
    const [state, setState] = useState(() =>
        selectorRef.current
            ? selectorRef.current(dispatcher.data[namespace])
            : dispatcher.data[namespace],
    );
    const stateRef = useRef<any>(state);
    stateRef.current = state;

    const isMount = useRef(false);
    useEffect(() => {
        isMount.current = true;
        return () => {
            isMount.current = false;
        };
    }, []);

    useEffect(() => {
        const handler = (data: any) => {
            if (!isMount.current) {
                // 如果 handler 执行过程中，组件被卸载了，则强制更新全局 data
                setTimeout(() => {
                    dispatcher.data[namespace] = data;
                    dispatcher.update(namespace);
                });
            } else {
                const currentState = selectorRef.current
                    ? selectorRef.current(data)
                    : data;
                const previousState = stateRef.current;
                if (!isEqual(currentState, previousState)) {
                    // 避免 currentState 拿到的数据是老的，从而导致 isEqual 比对逻辑有问题
                    stateRef.current = currentState;
                    setState(currentState);
                }
            }
        };

        dispatcher.callbacks[namespace] ||= new Set() as any;
        dispatcher.callbacks[namespace].add(handler);
        dispatcher.update(namespace);

        return () => {
            dispatcher.callbacks[namespace].delete(handler);
        };
    }, [namespace]);

    return state;
}