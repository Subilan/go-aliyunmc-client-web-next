import type { RouterNavigateOptions, To } from "react-router";
import { router } from "~/routes";

export function navigate(to: To | number, opts?: RouterNavigateOptions) {
    if (typeof to === 'number') {
        return router.navigate(to)
    }
    return router.navigate(to, opts)
}