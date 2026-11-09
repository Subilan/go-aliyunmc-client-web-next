import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import PaginatedTable, { type Column } from '~/components/paginated-table';
import type { User } from '~/types/User';
import {
	listUsers,
	banUser,
	unbanUser,
	createUser,
	changeUserRole,
	type BanResponse
} from '~/utils/requests/ban';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Spinner } from '~/components/ui/spinner';
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
import { PAGE_NAME_USERS } from '~/consts/page-names';
import { Toast } from '~/root';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import { Form } from '~/components/form/Form';
import { BanIcon, PlusIcon, ShieldCheckIcon, UndoIcon } from 'lucide-react';

interface CreateUserPayload {
	username: string;
	password: string;
}

const roleLabels: Record<User['role'], string> = {
	'': '普通用户',
	operator: '操作员',
	superuser: '超级用户'
};

const roleOptions: Array<{
	value: 'basic' | 'operator' | 'superuser';
	role: User['role'];
	label: string;
}> = [
	{ value: 'basic', role: '', label: '普通用户' },
	{ value: 'operator', role: 'operator', label: '操作员' },
	{ value: 'superuser', role: 'superuser', label: '超级用户' }
];

export default function UsersPage() {
	const currentUser = useContext(UserContext);
	const permissions = useContext(PermissionsContext);
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

	// Confirm dialog for unban/ban row actions
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState<{ user: User; type: 'ban' | 'unban' } | null>(null);
	const [confirmLoading, setConfirmLoading] = useState(false);

	const [roleOpen, setRoleOpen] = useState(false);
	const [roleAction, setRoleAction] = useState<User | null>(null);
	const [selectedRole, setSelectedRole] = useState<User['role']>('');
	const [roleLoading, setRoleLoading] = useState(false);

	const [createOpen, setCreateOpen] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);
	const [createRole, setCreateRole] = useState<User['role']>('');
	const createForm = useForm<CreateUserPayload>();
	const createRoleOptions = roleOptions.filter(option => {
		if (currentUser?.role === 'superuser') return true;
		if (currentUser?.role === 'operator') return option.role !== 'superuser';
		return false;
	});

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

	function openConfirm(user: User, type: 'ban' | 'unban') {
		setConfirmAction({ user, type });
		setConfirmOpen(true);
	}

	function openRoleDialog(user: User) {
		if (user.ID === currentUser?.ID) return;
		setRoleAction(user);
		setSelectedRole(user.role);
		setRoleOpen(true);
	}

	function openCreateDialog() {
		createForm.reset({ username: '', password: '' });
		setCreateRole('');
		setCreateOpen(true);
	}

	function handleCreateDialogOpenChange(open: boolean) {
		if (createLoading) return;
		setCreateOpen(open);
		if (!open) createForm.reset({ username: '', password: '' });
	}

	function handleRoleDialogOpenChange(open: boolean) {
		if (roleLoading) return;
		setRoleOpen(open);
		if (!open) setRoleAction(null);
	}

	function handleSelectedRoleChange(value: string) {
		const option = roleOptions.find(item => item.value === value);
		if (option) setSelectedRole(option.role);
	}

	function handleCreateRoleChange(value: string) {
		const option = roleOptions.find(item => item.value === value);
		if (option) setCreateRole(option.role);
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

	async function handleRoleChange() {
		if (
			!roleAction ||
			roleAction.ID === currentUser?.ID ||
			selectedRole === roleAction.role
		) {
			return;
		}

		setRoleLoading(true);
		try {
			const res = await changeUserRole({
				user_id: roleAction.ID,
				role: selectedRole
			});
			if (res.error) {
				Toast.error(res.error);
				return;
			}

			Toast.success(`已将「${roleAction.username}」的权限变更为${roleLabels[selectedRole]}`);
			setRoleOpen(false);
			setRoleAction(null);
			await fetch();
		} catch {
			Toast.error('权限变更失败，请检查网络后重试');
		} finally {
			setRoleLoading(false);
		}
	}

	async function handleCreateUser(data: CreateUserPayload) {
		setCreateLoading(true);
		try {
			const res = await createUser({
				username: data.username,
				password: data.password,
				role: createRole
			});
			if (res.error) {
				Toast.error(res.error);
				return;
			}

			Toast.success(
				`已创建${roleLabels[res.data!.role]}「${res.data!.username}」`
			);
			setCreateOpen(false);
			createForm.reset({ username: '', password: '' });
			if (page === 0) {
				await fetch();
			} else {
				setPage(0);
			}
		} catch {
			Toast.error('创建用户失败，请检查网络后重试');
		} finally {
			setCreateLoading(false);
		}
	}

	const columns: Column<User>[] = [
		{ id: 'id', label: 'ID', render: u => u.ID, align: 'center' },
		{ id: 'username', label: '用户名', render: u => u.username, sortable: true },
		{
			id: 'role',
			label: '角色',
			align: 'center',
			render: u => roleLabels[u.role],
		},
		{
			id: 'banned',
			label: '状态',
			align: 'center',
			render: u =>
				u.banned ? (
					<Badge className="bg-destructive text-white">已封禁</Badge>
				) : (
					<Badge className="bg-green-600 text-white">正常</Badge>
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
				return (
					<div className="flex flex-wrap items-center justify-center gap-2">
						{permissions?.can_change_user_role && (
							<Button size="sm" variant="outline" onClick={() => openRoleDialog(u)}>
								<ShieldCheckIcon className="size-3.5 mr-1" />
								权限变更
							</Button>
						)}
						{u.banned ? (
							<Button size="sm" variant="outline" onClick={() => openConfirm(u, 'unban')}>
								<UndoIcon className="size-3.5 mr-1" />
								取消封禁
							</Button>
						) : (
							<Button size="sm" variant="destructive" onClick={() => openConfirm(u, 'ban')}>
								<BanIcon className="size-3.5 mr-1" />
								封禁
							</Button>
						)}
					</div>
				);
			},
		},
	];

	return (
		<>
			<PageHeader
				actions={
					permissions?.can_create_user && (
						<Button onClick={openCreateDialog}>
							<PlusIcon data-icon="inline-start" />
							创建用户
						</Button>
					)
				}
			>
				{PAGE_NAME_USERS}
			</PageHeader>
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

			<Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>创建用户</DialogTitle>
						<DialogDescription>
							设置用户名、密码和初始权限。创建后可使用这里设置的密码登录。
						</DialogDescription>
					</DialogHeader>

					<form
						id="create-user-form"
						className="flex flex-col gap-3"
						onSubmit={createForm.handleSubmit(handleCreateUser)}
					>
						<Form.StringInput
							name="username"
							label="用户名"
							required
							minlength={4}
							maxlength={12}
							control={createForm.control}
							rules={{
								pattern: {
									value: /^[A-Za-z0-9_]+$/,
									message: '只能包含英文字母、数字和下划线'
								}
							}}
						/>
						<Form.StringInput
							name="password"
							label="密码"
							required
							minlength={8}
							maxlength={20}
							control={createForm.control}
							rules={{
								validate(value) {
									if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
										return '密码必须包含英文字母和数字';
									}
									return undefined;
								}
							}}
						/>
						<p className="-mt-1 text-xs text-muted-foreground">
							密码将明文显示，请确认当前屏幕环境安全。
						</p>
						<div className="grid gap-2">
							<label className="text-sm font-medium" htmlFor="create-user-role">
								权限
							</label>
							<Select
								value={
									roleOptions.find(option => option.role === createRole)?.value ??
									'basic'
								}
								onValueChange={handleCreateRoleChange}
								disabled={createLoading}
							>
								<SelectTrigger id="create-user-role" className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{createRoleOptions.map(option => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{currentUser?.role === 'operator' && (
								<p className="text-xs text-muted-foreground">
									管理员最多可创建操作员权限的用户。
								</p>
							)}
						</div>
					</form>

					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => handleCreateDialogOpenChange(false)}
							disabled={createLoading}
						>
							取消
						</Button>
						<Button
							type="submit"
							form="create-user-form"
							disabled={createLoading}
						>
							{createLoading && <Spinner data-icon="inline-start" />}
							{createLoading ? '创建中...' : '创建'}
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
						<Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>
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

			<Dialog open={roleOpen} onOpenChange={handleRoleDialogOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>权限变更</DialogTitle>
					</DialogHeader>

					<div className="py-2">
						<Select
							value={
								roleOptions.find(option => option.role === selectedRole)?.value ??
								'basic'
							}
							onValueChange={handleSelectedRoleChange}
							disabled={roleLoading}
						>
							<SelectTrigger id="user-role" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{roleOptions.map(option => (
									<SelectItem key={option.value} value={option.value}>
										<span className="flex w-full items-center justify-between gap-3">
											<span>{option.label}</span>
											{roleAction?.role === option.role && (
												<Badge variant="outline">当前</Badge>
											)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => handleRoleDialogOpenChange(false)}
							disabled={roleLoading}
						>
							取消
						</Button>
						<Button
							onClick={handleRoleChange}
							disabled={
								roleLoading ||
								!roleAction ||
								selectedRole === roleAction.role ||
								roleAction.ID === currentUser?.ID
							}
						>
							{roleLoading ? '保存中...' : '保存'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
