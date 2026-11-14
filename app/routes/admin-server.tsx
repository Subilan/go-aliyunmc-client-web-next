import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import PageHeader from '~/components/page-header';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Spinner } from '~/components/ui/spinner';
import { PAGE_NAME_SERVER } from '~/consts/page-names';
import { PermissionsContext } from '~/contexts/permissions';
import { Toast } from '~/root';
import type { ServerCountdownState, ServerCountdownStatus } from '~/types/ServerCountdown';
import {
	getServerCountdown,
	pauseServerCountdown,
	resetServerCountdown,
	resumeServerCountdown
} from '~/utils/requests/server-countdown';
import { getServerStatus } from '~/utils/requests/state';

const SYNC_INTERVAL_MS = 30_000;

const statusLabel: Partial<Record<ServerCountdownStatus, string>> = {
	running: '正在倒计时',
	paused: '已经暂停',
	finalizing: '正在关服'
};

function formatCountdown(totalSeconds: number) {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);
	const remainder = seconds % 60;
	return [hours, minutes, remainder]
		.map(value => String(value).padStart(2, '0'))
		.join(':');
}

export default function AdminServerPage() {
	const permissions = useContext(PermissionsContext);
	const [countdown, setCountdown] = useState<ServerCountdownState | null>(null);
	const [displaySeconds, setDisplaySeconds] = useState(0);
	const [playerCount, setPlayerCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [action, setAction] = useState<string | null>(null);
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
				const [countdownRes, statusRes] = await Promise.all([
					getServerCountdown(),
					getServerStatus()
				]);
				if (generation !== requestGenerationRef.current) return;
				if (countdownRes.error === null) {
					applyCountdown(countdownRes.data!);
				} else if (!silent) {
					Toast.error(countdownRes.error);
				}
				if (statusRes.error === null) {
					setPlayerCount(statusRes.data!.Value.playerCount);
				}
			} catch {
				if (generation !== requestGenerationRef.current) return;
				if (!silent) Toast.error('无法连接服务器，请稍后重试');
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
		if (actionInFlightRef.current) return;
		actionInFlightRef.current = true;
		requestGenerationRef.current++;
		setRefreshing(false);
		setAction(name);
		try {
			const result = await request();
			if (result.error !== null) {
				Toast.error(result.error);
				return;
			}
			applyCountdown(result.data!);
			Toast.success(successMessage);
		} catch {
			Toast.error('操作失败，请检查网络后重试');
		} finally {
			actionInFlightRef.current = false;
			setAction(null);
		}
	}

	const status = countdown?.status ?? 'inactive';
	const canManage = permissions?.can_manage_server_countdown === true;
	const canControl =
		canManage && countdown !== null && countdown.enabled && countdown.has_active_instance && status !== 'finalizing';
	const busy = action !== null;

	const offline = countdown !== null && !countdown.has_active_instance;
	const showTimer = countdown !== null && !offline && (status === 'running' || status === 'paused');
	const badge = offline
		? '不在线'
		: playerCount > 0
			? '有人在线'
			: status === 'paused'
				? '已暂停'
				: null;

	return (
		<>
			<PageHeader>{PAGE_NAME_SERVER}</PageHeader>

			<section className="flex flex-col gap-3">
				{countdown !== null && statusLabel[status] && (
					<span className="text-sm text-neutral-600">{statusLabel[status]}</span>
				)}

				<Card>
					<CardContent className="flex flex-col gap-4">
						{loading ? (
							<div className="flex min-h-32 items-center justify-center">
								<Spinner />
							</div>
						) : countdown === null ? (
							<div className="flex min-h-32 items-center justify-center text-sm text-neutral-500">
								无法显示关服倒计时状态
							</div>
						) : (
							<>
								<span className="text-sm text-neutral-500">倒计时管理</span>
								<div className="flex flex-wrap items-end gap-x-3 gap-y-1">
									<span
										data-testid="server-countdown"
										className="text-4xl font-semibold tracking-tight tabular-nums sm:text-6xl"
									>
										{showTimer ? formatCountdown(displaySeconds) : '--:--:--'}
									</span>
									{badge && <span className="text-sm text-neutral-500">（{badge}）</span>}
								</div>
								<div className="flex flex-wrap items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										disabled={refreshing}
										onClick={() => fetchState()}
									>
										{refreshing ? '刷新中...' : '刷新'}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										disabled={!canControl || busy}
										onClick={() =>
											runAction('reset', resetServerCountdown, '倒计时已重置')
										}
									>
										{busy && action === 'reset' ? '重置中...' : '重置'}
									</Button>
									{status === 'paused' ? (
										<Button
											variant="ghost"
											size="sm"
											disabled={!canControl || busy}
											onClick={() =>
												runAction('resume', resumeServerCountdown, '倒计时已继续')
											}
										>
											{busy && action === 'resume' ? '继续中...' : '继续'}
										</Button>
									) : (
										<Button
											variant="ghost"
											size="sm"
											disabled={!canControl || status !== 'running' || busy}
											onClick={() =>
												runAction('pause', pauseServerCountdown, '倒计时已暂停')
											}
										>
											{busy && action === 'pause' ? '暂停中...' : '暂停'}
										</Button>
									)}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</section>
		</>
	);
}
