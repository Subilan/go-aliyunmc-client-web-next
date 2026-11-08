import {
	AlertTriangleIcon,
	ClockIcon,
	PauseIcon,
	PlayIcon,
	RefreshCwIcon,
	RotateCcwIcon,
	ServerIcon,
	Settings2Icon
} from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import PageHeader from '~/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Spinner } from '~/components/ui/spinner';
import { PAGE_NAME_SERVER } from '~/consts/page-names';
import { PermissionsContext } from '~/contexts/permissions';
import { Toast } from '~/root';
import type { ServerCountdownState, ServerCountdownStatus } from '~/types/ServerCountdown';
import {
	getServerCountdown,
	pauseServerCountdown,
	resetServerCountdown,
	resumeServerCountdown,
	setServerCountdown
} from '~/utils/requests/server-countdown';

const SYNC_INTERVAL_MS = 30_000;
const MAX_COUNTDOWN_SECONDS = 7 * 24 * 60 * 60;

const statusMeta: Record<
	ServerCountdownStatus,
	{ label: string; className: string; description: string }
> = {
	inactive: {
		label: '未启动',
		className: 'border-neutral-200 bg-neutral-100 text-neutral-600',
		description: '服务器当前没有关服倒计时。'
	},
	running: {
		label: '进行中',
		className: 'border-amber-200 bg-amber-50 text-amber-700',
		description: '倒计时结束后将停止服务器、归档数据并回收实例。'
	},
	paused: {
		label: '已暂停',
		className: 'border-blue-200 bg-blue-50 text-blue-700',
		description: '剩余时间已冻结，恢复后将从当前位置继续。'
	},
	triggering: {
		label: '正在执行',
		className: 'border-red-200 bg-red-50 text-red-700',
		description: '倒计时已归零，系统正在执行关服和归档流程。'
	}
};

function formatCountdown(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const days = Math.floor(seconds / 86_400);
	const hours = Math.floor((seconds % 86_400) / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);
	const remainder = seconds % 60;
	const time = [hours, minutes, remainder]
		.map(value => String(value).padStart(2, '0'))
		.join(':');
	return days > 0 ? `${days} 天 ${time}` : time;
}

export default function AdminServerPage() {
	const permissions = useContext(PermissionsContext);
	const [countdown, setCountdown] = useState<ServerCountdownState | null>(null);
	const [displaySeconds, setDisplaySeconds] = useState(0);
	const [hasActiveInstance, setHasActiveInstance] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [action, setAction] = useState<string | null>(null);
	const [manualOpen, setManualOpen] = useState(false);
	const [manualSeconds, setManualSeconds] = useState('');
	const [manualError, setManualError] = useState<string | null>(null);
	const zeroRefreshRef = useRef(false);
	const requestGenerationRef = useRef(0);
	const actionInFlightRef = useRef(false);

	const applyCountdown = useCallback((next: ServerCountdownState) => {
		setCountdown(next);
		setDisplaySeconds(next.remaining_seconds);
	}, []);

	const fetchState = useCallback(
		async (silent = false) => {
			if (actionInFlightRef.current) return;
			const generation = ++requestGenerationRef.current;
			if (!silent) setRefreshing(true);
			try {
				const countdownRes = await getServerCountdown();
				if (generation !== requestGenerationRef.current) return;
				if (countdownRes.error === null) {
					applyCountdown(countdownRes.data!);
					setHasActiveInstance(countdownRes.data!.has_active_instance);
					setLoadError(null);
				} else {
					setLoadError(countdownRes.error);
					if (!silent) Toast.error(countdownRes.error);
				}
			} catch {
				if (generation !== requestGenerationRef.current) return;
				if (!silent) {
					const message = '无法连接服务器，请稍后重试';
					setLoadError(message);
					Toast.error(message);
				}
			} finally {
				if (!silent) {
					setLoading(false);
					setRefreshing(false);
				}
			}
		},
		[applyCountdown]
	);

	useEffect(() => {
		fetchState();
	}, [fetchState]);

	useEffect(() => {
		const sync = () => {
			if (document.visibilityState === 'visible') fetchState(true);
		};
		const interval = window.setInterval(sync, SYNC_INTERVAL_MS);
		document.addEventListener('visibilitychange', sync);
		return () => {
			window.clearInterval(interval);
			document.removeEventListener('visibilitychange', sync);
		};
	}, [fetchState]);

	useEffect(() => {
		if (countdown?.status !== 'running') return;
		const interval = window.setInterval(() => {
			setDisplaySeconds(previous => Math.max(0, previous - 1));
		}, 1_000);
		return () => window.clearInterval(interval);
	}, [countdown?.status]);

	useEffect(() => {
		if (displaySeconds > 0) {
			zeroRefreshRef.current = false;
			return;
		}
		if (countdown?.status !== 'running' || zeroRefreshRef.current) return;
		zeroRefreshRef.current = true;
		const timeout = window.setTimeout(() => fetchState(true), 1_500);
		return () => window.clearTimeout(timeout);
	}, [countdown?.status, displaySeconds, fetchState]);

	async function runAction(
		name: string,
		request: () => ReturnType<typeof pauseServerCountdown>,
		successMessage: string
	) {
		if (actionInFlightRef.current) return false;
		actionInFlightRef.current = true;
		requestGenerationRef.current++;
		setRefreshing(false);
		setAction(name);
		try {
			const result = await request();
			if (result.error !== null) {
				Toast.error(result.error);
				return false;
			}
			applyCountdown(result.data!);
			setHasActiveInstance(result.data!.has_active_instance);
			setLoadError(null);
			Toast.success(successMessage);
			return true;
		} catch {
			Toast.error('操作失败，请检查网络后重试');
			return false;
		} finally {
			actionInFlightRef.current = false;
			setAction(null);
		}
	}

	async function handleManualSet() {
		const seconds = Number(manualSeconds);
		if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_COUNTDOWN_SECONDS) {
			setManualError('请输入 1 到 604800 之间的整数秒数');
			return;
		}
		const ok = await runAction(
			'manual',
			() => setServerCountdown(seconds),
			'倒计时已开始'
		);
		if (ok) {
			setManualOpen(false);
			setManualError(null);
		}
	}

	function openManualDialog() {
		setManualSeconds(String(countdown?.configured_seconds ?? 1200));
		setManualError(null);
		setManualOpen(true);
	}

	const status = countdown?.status ?? 'inactive';
	const meta = statusMeta[status];
	const enabled = countdown?.enabled ?? false;
	const canManage = permissions?.can_manage_server_countdown === true;
	const canControl = canManage && enabled && hasActiveInstance && status !== 'triggering';
	const busy = action !== null;

	return (
		<>
			<PageHeader
				actions={
					<Button
						variant="outline"
						disabled={refreshing}
						onClick={() => fetchState()}
					>
						<RefreshCwIcon className={refreshing ? 'animate-spin' : ''} />
						刷新状态
					</Button>
				}
			>
				{PAGE_NAME_SERVER}
			</PageHeader>

			{loadError && (
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>无法获取关服倒计时</AlertTitle>
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			)}

			{!loading && countdown !== null && !enabled && (
				<Alert>
					<AlertTriangleIcon />
					<AlertTitle>关服倒计时未启用</AlertTitle>
					<AlertDescription>
						请先在服务端配置中启用空服自动归档监控，再使用此页面进行管理。
					</AlertDescription>
				</Alert>
			)}

			{!loading && countdown?.enabled && !hasActiveInstance && (
				<Alert>
					<ServerIcon />
					<AlertTitle>暂无活跃实例</AlertTitle>
					<AlertDescription>
						关服倒计时需要在存在活跃实例时启动，当前不会执行自动关服。
					</AlertDescription>
				</Alert>
			)}

			{!loading && permissions !== null && !canManage && (
				<Alert>
					<AlertTriangleIcon />
					<AlertTitle>只读模式</AlertTitle>
					<AlertDescription>
						当前账号可以查看关服倒计时，但没有修改权限。
					</AlertDescription>
				</Alert>
			)}

			{status === 'triggering' && (
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>关服流程正在执行</AlertTitle>
					<AlertDescription>
						请勿操作实例；流程完成后状态会自动更新。
					</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader className="border-b">
					<CardTitle className="flex items-center gap-2">
						<ClockIcon />
						下一次自动关服
					</CardTitle>
					<CardDescription>
						页面每秒本地更新，并每 30 秒与服务器校准一次。
					</CardDescription>
					<CardAction>
						<Badge className={meta.className}>{meta.label}</Badge>
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					{loading ? (
						<div className="flex min-h-56 items-center justify-center">
							<Spinner />
						</div>
					) : countdown === null ? (
						<div className="flex min-h-56 items-center justify-center text-sm text-neutral-500">
							无法显示关服倒计时状态
						</div>
					) : (
						<>
							<div className="flex min-h-48 flex-col items-center justify-center rounded-xl bg-neutral-50 py-8 ring-1 ring-neutral-200/70">
								<span className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-400">
									Remaining
								</span>
								<span
									data-testid="server-countdown"
									className="mt-3 text-4xl font-semibold tracking-tight tabular-nums sm:text-6xl"
								>
									{formatCountdown(displaySeconds)}
								</span>
								<span className="mt-3 text-sm text-neutral-500">
									{meta.description}
								</span>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								{status === 'paused' ? (
									<Button
										disabled={!canControl || busy}
										onClick={() =>
											runAction('resume', resumeServerCountdown, '倒计时已继续')
										}
									>
										<PlayIcon />
										{busy && action === 'resume' ? '继续中...' : '继续倒计时'}
									</Button>
								) : (
									<Button
										disabled={!canControl || status !== 'running' || busy}
										onClick={() =>
											runAction('pause', pauseServerCountdown, '倒计时已暂停')
										}
									>
										<PauseIcon />
										{busy && action === 'pause' ? '暂停中...' : '暂停倒计时'}
									</Button>
								)}

								<Button
									variant="outline"
									disabled={!canControl || busy}
									onClick={() =>
										runAction('reset', resetServerCountdown, '倒计时已重置')
									}
								>
									<RotateCcwIcon />
									{busy && action === 'reset' ? '重置中...' : '重置倒计时'}
								</Button>

								<Button
									variant="secondary"
									disabled={!canControl || busy}
									onClick={openManualDialog}
								>
									<Settings2Icon />
									手动设置
								</Button>

								<span className="ml-auto text-xs text-neutral-500">
									默认时长：{formatCountdown(countdown?.configured_seconds ?? 0)}
								</span>
							</div>

							<div className="grid gap-3 border-t pt-5 text-sm text-neutral-600 sm:grid-cols-3">
								<div>
									<div className="text-xs text-neutral-400">触发条件</div>
									<div className="mt-1 font-medium text-neutral-700">服务器无玩家</div>
								</div>
								<div>
									<div className="text-xs text-neutral-400">执行动作</div>
									<div className="mt-1 font-medium text-neutral-700">停止、归档、回收</div>
								</div>
								<div>
									<div className="text-xs text-neutral-400">状态同步</div>
									<div className="mt-1 font-medium text-neutral-700">30 秒低频校准</div>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			<Dialog open={manualOpen} onOpenChange={setManualOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>手动设置关服倒计时</DialogTitle>
						<DialogDescription>
							设置后会立即开始倒计时，并覆盖当前运行或暂停中的倒计时。
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<label htmlFor="manual-countdown-seconds" className="text-sm font-medium">
							剩余时间（秒）
						</label>
						<Input
							id="manual-countdown-seconds"
							type="number"
							min={1}
							max={MAX_COUNTDOWN_SECONDS}
							step={1}
							value={manualSeconds}
							onChange={event => {
								setManualSeconds(event.target.value);
								setManualError(null);
							}}
							onKeyDown={event => {
								if (event.key === 'Enter') handleManualSet();
							}}
						/>
						<div className="flex flex-wrap gap-2">
							{[300, 600, 1200, 3600].map(seconds => (
								<Button
									key={seconds}
									type="button"
									variant="outline"
									size="xs"
									onClick={() => setManualSeconds(String(seconds))}
								>
									{formatCountdown(seconds)}
								</Button>
							))}
						</div>
						<p className="text-xs text-neutral-500">
							有效范围：1 秒至 7 天。设置前请确认服务器没有玩家在线。
						</p>
						{manualError && <p className="text-sm text-destructive">{manualError}</p>}
					</div>
					<DialogFooter>
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => setManualOpen(false)}
						>
							取消
						</Button>
						<Button disabled={busy} onClick={handleManualSet}>
							{busy && action === 'manual' ? '设置中...' : '开始倒计时'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
