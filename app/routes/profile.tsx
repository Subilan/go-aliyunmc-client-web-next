import { useContext } from 'react';
import { useNavigate, useRevalidator } from 'react-router';
import type { Route } from './+types/profile';
import { UserContext } from '~/contexts/user';
import {
	Alert,
	Button,
	Card,
	CardContent,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField
} from '@mui/material';
import { useForm } from 'react-hook-form';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import { Req } from '~/utils/requests/Req';
import { Auth } from '~/utils/auth';
import { Form } from '~/components/form/Form';

interface ChangePasswordPayload {
	oldPassword: string;
	newPassword: string;
	newPasswordConfirm: string;
}

export function meta({}: Route.MetaArgs) {
	return [{ title: '个人资料 - Seatide' }];
}

function userRoleText(role: string) {
	switch (role) {
		case '':
			return '普通用户';
		case 'operator':
			return '管理员';
		case 'superuser':
			return '超级用户';
		default:
			return '';
	}
}

export default function Profile() {
	const user = useContext(UserContext);
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const deleteOpen = useStateNamed(false);
	const loading = useStateNamed(false);
	const deleteLoading = useStateNamed(false);
	const whitelistName = useStateNamed('');
	const bindLoading = useStateNamed(false);
	const unbindLoading = useStateNamed(false);
	const unbindOpen = useStateNamed(false);

	const { control, handleSubmit, reset } = useForm<ChangePasswordPayload>();

	const onSubmit = async (data: ChangePasswordPayload) => {
		loading.set(true);
		const { error } = await Req.changePassword(data.oldPassword, data.newPassword);
		loading.set(false);
		if (error === null) {
			Toast.success('密码修改成功');
			reset();
		} else {
			Toast.error(typeof error === 'string' ? error : '修改失败');
		}
	};

	const onDeleteAccount = async () => {
		deleteLoading.set(true);
		const ok = await Req.deleteAccount();
		deleteLoading.set(false);
		if (ok) {
			deleteOpen.set(false);
			await Auth.logout();
			navigate('/login');
		} else {
			Toast.error('注销失败');
		}
	};

	const onBindWhitelist = async () => {
		const name = whitelistName.current.trim();
		if (!name) return;
		bindLoading.set(true);
		const { error } = await Req.bindWhitelist(name);
		bindLoading.set(false);
		if (error === null) {
			Toast.success('白名单绑定成功');
			whitelistName.set('');
			Auth.clearCache();
			revalidator.revalidate();
		} else {
			Toast.error(typeof error === 'string' ? error : '绑定失败');
		}
	};

	const onUnbindWhitelist = async () => {
		unbindLoading.set(true);
		const { error } = await Req.unbindWhitelist();
		unbindLoading.set(false);
		if (error === null) {
			Toast.success('白名单解绑成功');
			unbindOpen.set(false);
			Auth.clearCache();
			revalidator.revalidate();
		} else {
			Toast.error(typeof error === 'string' ? error : '解绑失败');
		}
	};

	if (!user) {
		return (
			<div className="flex flex-col items-center gap-3 py-8">
				<span className="text-neutral-500">无法加载用户信息</span>
			</div>
		);
	}

	return (
		<>
			<h1 className="text-3xl mb-6">个人资料</h1>
			<div className="flex flex-col gap-3">
				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4">账户信息 / PROFILE</div>
						<div className="flex flex-col gap-3">
							<InfoRow label="用户 ID" value={String(user.ID)} />
							<InfoRow label="用户名" value={user.username} />
							<InfoRow label="权限等级" value={userRoleText(user.role)} />
							<InfoRow
								label="注册时间"
								value={new Date(user.CreatedAt).toLocaleString('zh-CN')}
							/>
							<InfoRow
								label="最后更新"
								value={new Date(user.UpdatedAt).toLocaleString('zh-CN')}
							/>
						</div>
					</CardContent>
				</Card>

				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4">修改密码 / RESET PASSWORD</div>
						<form
							className="flex flex-col gap-3"
							onSubmit={handleSubmit(onSubmit)}
						>
							<Form.StringInput
								name="oldPassword"
								label="原密码"
								type="password"
								required
								control={control}
							/>
							<Form.StringInput
								name="newPassword"
								label="新密码"
								type="password"
								required
								minlength={8}
								maxlength={20}
								control={control}
							/>
							<Form.StringInput
								name="newPasswordConfirm"
								label="确认新密码"
								type="password"
								required
								control={control}
								rules={{
									validate(value, formValues) {
										if (value !== formValues.newPassword) return '两次密码不匹配';
										return undefined;
									}
								}}
							/>
							<div className="flex justify-end">
								<Button
									variant="contained"
									type="submit"
									loading={loading.current}
								>
									确认修改
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4">白名单绑定 / GAME ACCOUNT BINDING</div>
						{user.whitelist_uuid ? (
							<div className="flex flex-col gap-3">
								<InfoRow label="绑定状态" value="已绑定" />
								<InfoRow label="UUID" value={user.whitelist_uuid} />
								<div className="mt-3">
									<Button
										variant="outlined"
										color="error"
										onClick={() => unbindOpen.set(true)}
									>
										解绑
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<Alert severity="warning">
									请务必填写你自己的游戏账号，否则会导致账号被封禁。
								</Alert>
								<div className="flex gap-3 items-center">
									<TextField
										label="游戏名（区分大小写）"
										size="small"
										value={whitelistName.current}
										onChange={e => whitelistName.set(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') onBindWhitelist();
										}}
									/>
									<Button
										variant="contained"
										onClick={onBindWhitelist}
										loading={bindLoading.current}
										disabled={!whitelistName.current.trim()}
									>
										绑定
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card variant="outlined">
					<CardContent>
						<div className="tracking-wider text-sm mb-4">危险操作 / DANGER ZONE</div>
						<Button
							variant="outlined"
							color="error"
							onClick={() => deleteOpen.set(true)}
						>
							删除账户
						</Button>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={deleteOpen.current}
				onClose={() => deleteOpen.set(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>删除账户</DialogTitle>
				<DialogContent>
					<p>
						确定要删除账户吗？此操作不可撤销，你的账号数据将被删除，且此用户名无法重复使用。
					</p>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => deleteOpen.set(false)} disabled={deleteLoading.current}>
						取消
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={onDeleteAccount}
						loading={deleteLoading.current}
					>
						确认删除
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={unbindOpen.current}
				onClose={() => unbindOpen.set(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>解绑白名单</DialogTitle>
				<DialogContent>
					<p>确定要解绑白名单吗？解绑后你可以重新绑定。</p>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => unbindOpen.set(false)} disabled={unbindLoading.current}>
						取消
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={onUnbindWhitelist}
						loading={unbindLoading.current}
					>
						确认解绑
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-4">
			<span className="text-neutral-500 w-20 shrink-0">{label}</span>
			<span>{value}</span>
		</div>
	);
}
