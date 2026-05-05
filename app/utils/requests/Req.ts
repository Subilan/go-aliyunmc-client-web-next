import login from "~/utils/requests/login";
import logout from "~/utils/requests/logout";
import getProfile from "~/utils/requests/profile";
import register from "~/utils/requests/register";
import { getActiveInstance, getCandidates, deleteActiveInstance } from "~/utils/requests/instance";
import { getServerStatus, getInstanceStatus } from "~/utils/requests/state";
import { getTasks, getBalance, getPlayerListHistory, getIdleRemainingSecs } from "~/utils/requests/home";
import { triggerTask, getTask, getTaskDefinition } from "~/utils/requests/task";
import changePassword from "~/utils/requests/change-password";
import deleteAccount from "~/utils/requests/delete-account";
import { bindWhitelist, unbindWhitelist } from "~/utils/requests/whitelist";

export const Req = {
    login,
    logout,
    getProfile,
    register,
    changePassword,
    deleteAccount,
    bindWhitelist,
    unbindWhitelist,
    getActiveInstance,
    getCandidates,
    deleteActiveInstance,
    getServerStatus,
    getInstanceStatus,
    getTasks,
    getBalance,
    getPlayerCountHistory: getPlayerListHistory,
    getIdleRemainingSecs,
    triggerTask,
    getTask,
    getTaskDefinition
}