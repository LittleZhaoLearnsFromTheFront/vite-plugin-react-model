// @ts-nocheck
import React, { useEffect, useMemo, useRef, ReactNode } from "react";
import { Context, Dispatcher, Models, Namespaces, useModel } from "./useModel";
import { models as rawModels } from "@/.plugin-model/model";
import { Spin } from "antd"
interface ExecutorProps {
    hook: () => any;
    onUpdate: (val: any) => void;
    namespace: string;
}

function Executor(props: ExecutorProps) {
    const { hook, onUpdate, namespace } = props;
    const updateRef = useRef(onUpdate);
    const initialLoad = useRef(false);

    let data: any;
    try {
        data = hook();
    } catch (e) {
        console.error(
            `plugin-model: Invoking '${namespace || 'unknown'}' model failed:`,
            e,
        );
    }

    // 首次执行时立刻返回初始值
    useMemo(() => {
        updateRef.current(data);
    }, []);

    useEffect(() => {
        if (initialLoad.current) {
            updateRef.current(data);
        } else {
            initialLoad.current = true;
        }
    });

    return null;
}

const dispatcher = new Dispatcher();

function InitialStateProvider(props: any) {
    const appLoaded = useRef(false);
    const { loading = false } = useModel("@@initialState") || {};
    useEffect(() => {
        if (!loading) {
            appLoaded.current = true;
        }
    }, [loading]);
    if (loading && !appLoaded.current) {
        return <div style={{ display: 'flex', justifyContent: 'center' }}><Spin /></div>;
    }
    return props.children;
}
//使用context全局保存值
export function Provider(props: {
    children: ReactNode;
}) {
    const newModels = useMemo(() => {
        return Object.keys(rawModels).reduce((memo, key) => {
            memo[rawModels[key as keyof Models].namespace] = rawModels[key as keyof Models].model;
            return memo;
        }, {} as { [key in string]: any });
    }, []);
    return (
        <Context.Provider value={{ dispatcher }
        }>
            {
                Object.keys(newModels).map((namespace) => {
                    return (
                        <Executor
                            //@ts-ignore
                            key={namespace}
                            //@ts-ignore
                            hook={newModels[namespace]}
                            namespace={namespace}
                            onUpdate={(val: any) => {
                                //@ts-ignore
                                dispatcher.data[namespace] = val;
                                dispatcher.update(namespace as Namespaces);
                            }
                            }
                        />
                    );
                })}
            <InitialStateProvider>
                {props.children}
            </InitialStateProvider>
        </Context.Provider>
    );
}
