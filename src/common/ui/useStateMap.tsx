import { useState, Dispatch, SetStateAction } from 'react';

export interface IUseStateMap<T> {
    [key: string]: {
        get: T,
        set: Dispatch<SetStateAction<T>>
    }
}

export function useStateMap<T>(map: { [key: string]: T }): IUseStateMap<T> {
    return Object.entries(map).reduce((result, [key, data]) => {
        const [get, set] = useState<T>(data)
        return {
            ...result,
            [key]: { get, set }
        }
    }, {})
}
