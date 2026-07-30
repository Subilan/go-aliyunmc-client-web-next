import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import PaginatedTable, { type Column } from '~/components/paginated-table';
import type { User } from '~/types/User';
import { listUsers, banUser, unbanUser, type BanResponse } from '~/utils/requests/ban';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_BAN } from '~/consts/page-names';
import { Toast } from '~/root';
import { UserContext } from '~/contexts/user';
import { BanIcon, CheckIcon, ShieldBanIcon } from 'lucide-react';

export default function BanPage() {
	const currentUser = useContext(UserContext);
	const [rows, setRows] = useState<User[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(10);
	const [sort, setSort] = useState('id');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [loading, setLoading] = useState(true);
	const [bannedFilter, setBannedFilter] = useState('');
	const [usernameSearch, setUsernameSearch] = useState('');
	const [usernameFilter, setUsernameFilter] = useState('');
	const [banDialogOpen, setBanDialogOpen] = useState(false);
	const [selectedBanUserId, setSelectedBanUserId] = useState<string>('');
	const [banCandidates, setBanCandidates] = useState<User[]>([]);
	const [banCandidatesLoading, setBanCandidatesLoading] = useState(false);
	const [banning, setBanning] = useState(false);

	// Confirm dialog for unban/ban row actions
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState<{ user: User; type: 'ban' | 'unban' } | null>(null);
	const [confirmLoading, setConfirmLoading] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetch = useCallback(async () => {
		setLoading(true);
		const res = await listUsers({
			banned: bannedFilter || undefined,
			username: usernameFilter || undefined,
			limit: pageSize,
			offset: page * pageSize,
			sort,
			order,
		});
		if (res.error === null) {
			setRows(res.data!.users);
			setTotal(res.data!.total);
		}
		setLoading(false);
	}, [page, pageSize, sort, order, bannedFilter, usernameFilter]);

	useEffect(() => {
		fetch();
	}, [fetch]);

	// Load non-banned users for the ban dialog dropdown
	useEffect(() => {
		if (!banDialogOpen) return;
		setBanCandidatesLoading(true);
		setSelectedBanUserId('');
		listUsers({ banned: 'false', limit: 100, offset: 0 }).then(res => {
			if (res.error === null) {
				// Exclude current user from candidates
				setBanCandidates(res.data!.users.filter(u => u.ID !== currentUser?.ID));
			}
			setBanCandidatesLoading(false);
		});
	}, [banDialogOpen, currentUser?.ID]);

	// Debounced username search: update input immediately, filter after delay
	function handleUsernameChange(value: string) {
		setUsernameSearch(value);
		if (debounceRef.current !== null) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setUsernameFilter(value);
			setPage(0);
		}, 300);
	}

	function handleBannedFilterChange(value: string) {
		setBannedFilter(value);
		setPage(0);
	}

	const handleSortChange = useCallback((newSort: string, newOrder: 'asc' | 'desc') => {
		setSort(newSort);
		setOrder(newOrder);
		setPage(0);
	}, []);

	async function handleBanSubmit() {
		if (!selectedBanUserId) return;

		setBanning(true);
		const userId = Number(selectedBanUserId);
		const res = await banUser({ user_ids: [userId] });
		setBanning(false);

		if (res.error) {
			Toast.error(res.error);
		} else {
			const data = res.data! as BanResponse;
			if (data.affected_count > 0) {
				Toast.success('已封禁用户');
			}
			if (data.skipped_self) {
				Toast.info('已跳过自己');
			}
			setBanDialogOpen(false);
			setSelectedBanUserId('');
			fetch();
		}
	}

	function openConfirm(user: User, type: 'ban' | 'unban') {
		setConfirmAction({ user, type });
		setConfirmOpen(true);
	}

	async function handleConfirmAction() {
		if (!confirmAction) return;
		setConfirmLoading(true);
		const { user, type } = confirmAction;

		const fn = type === 'ban' ? banUser : unbanUser;
		const res = await fn({ user_ids: [user.ID] });
		setConfirmLoading(false);

		if (res.error) {
			Toast.error(res.error);
		} else {
			const data = res.data! as BanResponse;
			if (data.affected_count > 0) {
				Toast.success(type === 'ban' ? '已封禁用户' : '已取消封禁');
			}
			if (data.skipped_self) {
				Toast.info('不能操作自己');
			}
			setConfirmOpen(false);
			setConfirmAction(null);
			fetch();
		}
	}

	const columns: Column<User>[] = [
		{ id: 'id', label: 'ID', render: u => u.ID, align: 'center' },
		{ id: 'username', label: '用户名', render: u => u.username, sortable: true },
		{
			id: 'role',
			label: '角色',
			align: 'center',
			render: u => {
				const label = u.role === 'superuser' ? '超级用户' : u.role === 'operator' ? '操作员' : '普通用户';
				return (
					<Badge variant={u.role === '' ? 'secondary' : 'default'}>
						{label}
					</Badge>
				);
			},
		},
		{
			id: 'banned',
			label: '封禁状态',
			align: 'center',
			render: u =>
				u.banned ? (
					<Badge variant="destructive">已封禁</Badge>
				) : (
					<Badge variant="outline" className="text-green-600 border-green-600">正常</Badge>
				),
			sortable: false,
		},
		{
			id: 'created_at',
			label: '注册时间',
			align: 'center',
			render: u => u.CreatedAt ? new Date(u.CreatedAt).toLocaleString('zh-CN') : '—',
			sortable: true,
			cellClassName: 'hidden md:table-cell',
		},
		{
			id: 'actions',
			label: '操作',
			align: 'center',
			render: u => {
				if (u.ID === currentUser?.ID) {
					return <span className="text-muted-foreground text-sm">自己</span>;
				}
				if (u.banned) {
					return (
						<Button size="sm" variant="outline" onClick={() => openConfirm(u, 'unban')}>
							<CheckIcon className="size-3.5 mr-1" />
							取消封禁
						</Button>
					);
				}
				return (
					<Button size="sm" variant="destructive" onClick={() => openConfirm(u, 'ban')}>
						<BanIcon className="size-3.5 mr-1" />
						封禁
					</Button>
				);
			},
		},
	];

	return (
		<>
			<PageHeader>{PAGE_NAME_BAN}</PageHeader>
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-3 flex-wrap">
					<Input
						className="w-48"
						placeholder="搜索用户名..."
						value={usernameSearch}
						onChange={e => handleUsernameChange(e.target.value)}
					/>
					<Select value={bannedFilter} onValueChange={handleBannedFilterChange}>
						<SelectTrigger className="w-32">
							<SelectValue placeholder="封禁状态" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">全部</SelectItem>
							<SelectItem value="true">已封禁</SelectItem>
							<SelectItem value="false">未封禁</SelectItem>
						</SelectContent>
					</Select>
					<div className="flex-1" />
					<Button onClick={() => setBanDialogOpen(true)}>
						<ShieldBanIcon className="size-4 mr-1.5" />
						封禁用户
					</Button>
				</div>

				<PaginatedTable
					columns={columns}
					rows={rows}
					getRowKey={u => u.ID}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					order={order}
					loading={loading}
					onPageChange={setPage}
					onPageSizeChange={size => {
						setPageSize(size);
						setPage(0);
					}}
					onSortChange={handleSortChange}
				/>
			</div>

			{/* Ban dialog */}
			<Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>封禁用户</DialogTitle>
						<DialogDescription>
							选择要封禁的用户
						</DialogDescription>
					</DialogHeader>
					<Select value={selectedBanUserId} onValueChange={setSelectedBanUserId} disabled={banCandidatesLoading}>
						<SelectTrigger>
							<SelectValue placeholder={banCandidatesLoading ? '加载中...' : '选择用户'} />
						</SelectTrigger>
						<SelectContent>
							{banCandidates.map(u => (
								<SelectItem key={u.ID} value={String(u.ID)}>
									{u.username}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<DialogFooter>
						<Button variant="outline" onClick={() => setBanDialogOpen(false)} disabled={banning}>
							取消
						</Button>
						<Button onClick={handleBanSubmit} disabled={banning || !selectedBanUserId}>
							{banning ? '封禁中...' : '确认封禁'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm dialog for row actions */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{confirmAction?.type === 'ban' ? '封禁用户' : '取消封禁'}
						</DialogTitle>
						<DialogDescription>
							{confirmAction?.type === 'ban'
								? `确定要封禁用户「${confirmAction?.user.username}」吗？封禁后该用户将无法登录和使用任何功能。`
								: `确定要取消对用户「${confirmAction?.user.username}」的封禁吗？`}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>
							取消
						</Button>
						<Button
							variant={confirmAction?.type === 'ban' ? 'destructive' : 'default'}
							onClick={handleConfirmAction}
							disabled={confirmLoading}
						>
							{confirmLoading ? '处理中...' : '确认'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
