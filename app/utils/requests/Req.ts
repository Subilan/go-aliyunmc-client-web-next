import login from "~/utils/requests/login";
import logout from "~/utils/requests/logout";
import getProfile from "~/utils/requests/profile";
import register from "~/utils/requests/register";
import { getActiveInstance, getCandidates } from "~/utils/requests/instance";
import { getServerStatus, getInstanceStatus } from "~/utils/requests/state";
import { getTasks, getBalance, getPlayerCountHistory, getIdleRemainingSecs } from "~/utils/requests/home";

export const Req = {
    login,
    logout,
    getProfile,
    register,
    getActiveInstance,
    getCandidates,
    getServerStatus,
    getInstanceStatus,
    getTasks,
    getBalance,
    getPlayerCountHistory,
    getIdleRemainingSecs
}