import { useState } from "react";

export default function useStateNamed<T>(initialValue: T) {
    const state = useState(initialValue);

    return {
        current: state[0],
        set: state[1]
    }
}