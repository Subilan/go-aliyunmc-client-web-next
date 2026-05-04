import login from "~/utils/requests/login";
import logout from "~/utils/requests/logout";
import getProfile from "~/utils/requests/profile";
import register from "~/utils/requests/register";
import { getActiveInstance, getCandidates, deleteActiveInstance } from "~/utils/requests/instance";
import { getServerStatus, getInstanceStatus } from "~/utils/requests/state";
import { getTasks, getBalance, getPlayerCountHistory, getIdleRemainingSecs } from "~/utils/requests/home";
import { triggerTask, getTask, getTaskDefinition } from "~/utils/requests/task";

export const Req = {
    login,
    logout,
    getProfile,
    register,
    getActiveInstance,
    getCandidates,
    deleteActiveInstance,
    getServerStatus,
    getInstanceStatus,
    getTasks,
    getBalance,
    getPlayerCountHistory,
    getIdleRemainingSecs,
    triggerTask,
    getTask,
    getTaskDefinition
}