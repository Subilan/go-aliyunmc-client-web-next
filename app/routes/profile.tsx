import { useContext, useEffect } from 'react';
import { useRevalidator } from 'react-router';
import type { MetaArgs } from 'react-router';
import PageHeader from '~/components/page-header';
import { UserContext } from '~/contexts/user';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Spinner } from '~/components/ui/spinner';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { AlertTriangleIcon } from 'lucide-react';
import type { Preferences } from '~/types/Preferences';

import { useForm } from 'react-hook-form';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import { Req } from '~/utils/requests/Req';
import { Auth } from '~/utils/auth';
import { Form } from '~/components/form/Form';
import { Times } from '~/utils/times';
import { navigate } from '~/utils/navigate';

interface ChangePasswordPayload {
	oldPassword: string;
	newPassword: string;
	newPasswordConfirm: string;
}

export function meta({}: MetaArgs) {
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
	const revalidator = useRevalidator();
	const deleteOpen = useStateNamed(false);
	const loading = useStateNamed(false);
	const deleteLoading = useStateNamed(false);
	const whitelistName = useStateNamed('');
	const bindLoading = useStateNamed(false);
	const unbindLoading = useStateNamed(false);
	const unbindOpen = useStateNamed(false);
	const prefs = useStateNamed<Preferences | null>(null);
	const prefsSaving = useStateNamed(false);

	const { control, handleSubmit, reset } = useForm<ChangePasswordPayload>();

	useEffect(() => {
		(async () => {
			const { data } = await Req.getPreferences();
			if (data) prefs.set(data);
		})();
	}, []);

	const onToggleLeaderboard = async () => {
		if (!prefs.current) return;
		const next = { ...prefs.current, leaderboard_opt_in: !prefs.current.leaderboard_opt_in };
		prefsSaving.set(true);
		const ok = await Req.updatePreferences(next);
		prefsSaving.set(false);
		if (ok) {
			prefs.set(next);
		} else {
			Toast.error('保存失败');
		}
	};

	const onToggleDisallowPublicGameStats = async () => {
		if (!prefs.current) return;
		const next = {
			...prefs.current,
			disallow_public_game_stats: !prefs.current.disallow_public_game_stats
		};
		prefsSaving.set(true);
		const ok = await Req.updatePreferences(next);
		prefsSaving.set(false);
		if (ok) {
			prefs.set(next);
		} else {
			Toast.error('保存失败');
		}
	};

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
				<span className="text-muted-foreground">无法加载用户信息</span>
			</div>
		);
	}

	return (
		<>
			<PageHeader>个人资料</PageHeader>
			<div className="flex flex-col gap-3">
				<Card>
					<CardHeader>
						<CardTitle>账户信息</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col gap-3">
							<InfoRow label="用户 ID" value={String(user.ID)} />
							<InfoRow label="用户名" value={user.username} />
							<InfoRow label="权限等级" value={userRoleText(user.role)} />
							<InfoRow label="注册时间" value={Times.formatDate(user.CreatedAt)} />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>偏好设置</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<span>参与排行榜</span>
							<Switch
								checked={prefs.current?.leaderboard_opt_in ?? false}
								onCheckedChange={onToggleLeaderboard}
								disabled={prefs.current === null || prefsSaving.current}
							/>
						</div>
						<div className="flex items-center justify-between mt-3">
							<span>将我的游戏统计页面设为不公开</span>
							<Switch
								checked={prefs.current?.disallow_public_game_stats ?? false}
								onCheckedChange={onToggleDisallowPublicGameStats}
								disabled={prefs.current === null || prefsSaving.current}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>修改密码</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
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
										if (value !== formValues.newPassword)
											return '两次密码不匹配';
										return undefined;
									}
								}}
							/>
							<div className="flex justify-end">
								<Button type="submit" disabled={loading.current}>
									{loading.current && <Spinner data-icon="inline-start" />}
									确认修改
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>白名单绑定</CardTitle>
					</CardHeader>
					<CardContent>
						{user.whitelist_uuid ? (
							<div className="flex flex-col gap-3">
								<InfoRow label="绑定状态" value="已绑定" />
								<InfoRow label="UUID" value={user.whitelist_uuid} />
								<div className="mt-3">
									<Button
										variant="outline"
										onClick={() => unbindOpen.set(true)}
									>
										解绑
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-800">
									<AlertTriangleIcon />
									<AlertDescription>
										请务必填写你自己的游戏账号，否则会导致账号被封禁。
									</AlertDescription>
								</Alert>
								<div className="flex gap-3 items-center">
									<Input
										placeholder="游戏名（区分大小写）"
										className="max-w-[240px]"
										value={whitelistName.current}
										onChange={e => whitelistName.set(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') onBindWhitelist();
										}}
									/>
									<Button
										onClick={onBindWhitelist}
										disabled={bindLoading.current || !whitelistName.current.trim()}
									>
										{bindLoading.current && <Spinner data-icon="inline-start" />}
										绑定
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>危险操作</CardTitle>
					</CardHeader>
					<CardContent>
						<Button
							variant="destructive"
							onClick={() => deleteOpen.set(true)}
						>
							删除账户
						</Button>
					</CardContent>
				</Card>
			</div>

			<Dialog open={deleteOpen.current} onOpenChange={v => deleteOpen.set(v)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>删除账户</DialogTitle>
						<DialogDescription>
							确定要删除账户吗？此操作不可撤销，你的账号数据将被删除，且此用户名无法重复使用。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => deleteOpen.set(false)} disabled={deleteLoading.current}>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={onDeleteAccount}
							disabled={deleteLoading.current}
						>
							{deleteLoading.current && <Spinner data-icon="inline-start" />}
							确认删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={unbindOpen.current} onOpenChange={v => unbindOpen.set(v)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>解绑白名单</DialogTitle>
						<DialogDescription>
							确定要解绑白名单吗？解绑后你可以重新绑定。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => unbindOpen.set(false)} disabled={unbindLoading.current}>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={onUnbindWhitelist}
							disabled={unbindLoading.current}
						>
							{unbindLoading.current && <Spinner data-icon="inline-start" />}
							确认解绑
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-4">
			<span className="text-muted-foreground w-20 shrink-0">{label}</span>
			<span>{value}</span>
		</div>
	);
}
