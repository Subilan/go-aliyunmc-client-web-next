import type { RouterNavigateOptions, To } from "react-router";
import { router } from "~/routes";

export function navigate(to: To | number, opts?: RouterNavigateOptions) {
    if (typeof to === 'number') {
        return router.navigate(to)
    }
    return router.navigate(to, opts)
}

/** 当前站内路径（含查询串），例如 `/start` 或 `/game/player-list?sort=desc` */
export function currentLocationPath() {
    if (typeof window === 'undefined') return '/';
    const { pathname, search } = router.state.location;
    return `${pathname}${search}`;
}