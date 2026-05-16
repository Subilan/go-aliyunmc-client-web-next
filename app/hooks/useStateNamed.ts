import { useState } from "react";

export type NamedState<T> = ReturnType<typeof useStateNamed<T>>;

export type NamedBooleanState = NamedState<boolean>;

export default function useStateNamed<T>(initialValue: T) {
    const state = useState(initialValue);

    return {
        current: state[0],
        set: state[1]
    }
}