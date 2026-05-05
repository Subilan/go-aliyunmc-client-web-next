import { useContext } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from './+types/profile';
import { UserContext } from '~/contexts/user';
import {
	Button,
	Card,
	CardContent,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle
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
	const changePwdOpen = useStateNamed(false);
	const deleteOpen = useStateNamed(false);
	const loading = useStateNamed(false);
	const deleteLoading = useStateNamed(false);

	const { control, handleSubmit, reset } = useForm<ChangePasswordPayload>();

	const onSubmit = async (data: ChangePasswordPayload) => {
		loading.set(true);
		const { error } = await Req.changePassword(data.oldPassword, data.newPassword);
		loading.set(false);
		if (error === null) {
			Toast.success('密码修改成功');
			changePwdOpen.set(false);
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

			<Card variant="outlined">
				<CardContent>
					<div className="tracking-wider text-sm mb-4">账户信息</div>
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
					<div className="mt-3">
						<span className="text-neutral-500">操作</span>
						<div className="mt-3 flex gap-3 items-center">
							<Button variant="outlined" onClick={() => changePwdOpen.set(true)}>
								修改密码
							</Button>
							<Button
								variant="outlined"
								color="error"
								onClick={() => deleteOpen.set(true)}
							>
								删除账户
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="mt-4"></div>

			<Dialog
				open={changePwdOpen.current}
				onClose={() => changePwdOpen.set(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>修改密码</DialogTitle>
				<DialogContent>
					<form id="changePwdForm" className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
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
					</form>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => changePwdOpen.set(false)} disabled={loading.current}>
						取消
					</Button>
					<Button
						variant="contained"
						type="submit"
						form="changePwdForm"
						loading={loading.current}
					>
						确认修改
					</Button>
				</DialogActions>
			</Dialog>

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
