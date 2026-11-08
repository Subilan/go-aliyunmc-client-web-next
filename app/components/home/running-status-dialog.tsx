import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCwIcon, ServerIcon, WifiOffIcon } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import type { ServerQuery } from '~/types/ServerQuery';
import { queryServer } from '~/utils/requests/server';

interface RunningStatusDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	online: boolean;
	playerCount: number;
}

function displayValue(value: string | number | undefined | null) {
	if (value === undefined || value === null || value === '') return '—';
	return String(value);
}

function stripMinecraftFormatting(value: string) {
	return value.replace(/Â?§[0-9A-FK-OR]/gi, '').trim();
}

function InfoItem({ label, value }: { label: string; value: string | number | undefined | null }) {
	return (
		<div className="min-w-0 px-4 py-3">
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="mt-1 break-all font-medium">{displayValue(value)}</div>
		</div>
	);
}

function QueryDetails({ query, playerCount }: { query: ServerQuery; playerCount: number }) {
	const hostname = stripMinecraftFormatting(query.hostname);

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-muted/30">
			<div className="flex items-center justify-between gap-4 p-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2 text-sm font-medium text-green-600">
						<span className="size-2 rounded-full bg-green-500" />
						在线
					</div>
					<div className="mt-2 break-words text-lg font-medium text-foreground">
						{hostname || '未提供服务器描述'}
					</div>
				</div>
				<div className="shrink-0 text-right">
					<div className="text-2xl tabular-nums">
						<span className="font-medium text-black">{playerCount}</span>
						<span className="font-light text-muted-foreground">
							/{query.maxplayers > 0 ? query.maxplayers : '—'}
						</span>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 divide-y border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
				<InfoItem label="游戏版本" value={query.version} />
				<InfoItem label="服务端平台" value={query.platform} />
			</div>
		</div>
	);
}

export default function RunningStatusDialog({
	open,
	onOpenChange,
	online,
	playerCount
}: RunningStatusDialogProps) {
	const [query, setQuery] = useState<ServerQuery | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestIdRef = useRef(0);

	const loadQuery = useCallback(async () => {
		if (!online) return;

		const requestId = ++requestIdRef.current;
		setLoading(true);
		setError(null);
		setQuery(null);

		try {
			const result = await queryServer();
			if (requestId !== requestIdRef.current) return;

			if (result.error !== null) {
				setError(result.error);
				return;
			}
			setQuery(result.data);
		} catch {
			if (requestId === requestIdRef.current) {
				setError('查询服务器状态失败，请稍后重试');
			}
		} finally {
			if (requestId === requestIdRef.current) {
				setLoading(false);
			}
		}
	}, [online]);

	useEffect(() => {
		if (open && online) {
			loadQuery();
		} else {
			requestIdRef.current++;
			setQuery(null);
			setError(null);
			setLoading(false);
		}

		return () => {
			requestIdRef.current++;
		};
	}, [open, online, loadQuery]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>服务器运行状态</DialogTitle>
				</DialogHeader>

				<div className="min-h-[180px]">
					{!online ? (
						<EmptyState
							icon={WifiOffIcon}
							iconSize={36}
							iconClassName="text-muted-foreground opacity-50"
							title="服务器已离线"
							description="运行状态仅在服务器在线时可用。"
							className="min-h-[180px]"
						/>
					) : loading ? (
						<LoadingEmptyState
							className="min-h-[180px]"
							description="正在查询服务器状态..."
						/>
					) : error ? (
						<div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 text-center">
							<ServerIcon className="size-9 text-destructive/60" />
							<div>
								<div className="font-medium text-foreground">无法获取运行状态</div>
								<p className="mt-1 break-all text-sm text-muted-foreground">{error}</p>
							</div>
						</div>
					) : query ? (
						<QueryDetails query={query} playerCount={playerCount} />
					) : null}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={loadQuery} disabled={!online || loading}>
						<RefreshCwIcon className={loading ? 'animate-spin' : ''} />
						{loading ? '查询中...' : '重新查询'}
					</Button>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						关闭
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
