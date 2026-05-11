import login from "~/utils/requests/login";
import logout from "~/utils/requests/logout";
import getProfile from "~/utils/requests/profile";
import register from "~/utils/requests/register";
import { getActiveInstance, getCandidates, deleteActiveInstance } from "~/utils/requests/instance";
import { getServerStatus, getInstanceStatus } from "~/utils/requests/state";
import { getTasks, getTaskStats, getBalance, getPlayerListHistory, getIdleRemainingSecs } from "~/utils/requests/home";
import { triggerTask, getTask, getTaskDefinition } from "~/utils/requests/task";
import changePassword from "~/utils/requests/change-password";
import deleteAccount from "~/utils/requests/delete-account";
import { bindWhitelist, unbindWhitelist } from "~/utils/requests/whitelist";
import getPreferences from "~/utils/requests/get-preferences";
import updatePreferences from "~/utils/requests/update-preferences";
import { getAdvancements, getGameStats, getLeaderboard } from "~/utils/requests/game";
import getChatToken from "~/utils/requests/chat-token";
import { getChangelogs, createChangelog, updateChangelog, deleteChangelog, toggleLike } from "~/utils/requests/changelog";

export const Req = {
    login,
    logout,
    getProfile,
    register,
    changePassword,
    deleteAccount,
    bindWhitelist,
    unbindWhitelist,
    getPreferences,
    updatePreferences,
    getActiveInstance,
    getCandidates,
    deleteActiveInstance,
    getServerStatus,
    getInstanceStatus,
    getTasks,
    getTaskStats,
    getBalance,
    getPlayerCountHistory: getPlayerListHistory,
    getIdleRemainingSecs,
    triggerTask,
    getTask,
    getTaskDefinition,
    getAdvancements,
    getGameStats,
    getLeaderboard,
    getChatToken,
    getChangelogs,
    createChangelog,
    updateChangelog,
    deleteChangelog,
    toggleLike
}