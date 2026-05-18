import {
	Button,
	Card,
	CardContent,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Tooltip
} from '@mui/material';
import {
	ChartBarBigIcon,
	CogIcon,
	HelpCircleIcon,
	MessagesSquareIcon,
	type LucideIcon
} from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { redirect } from 'react-router';
import { Form } from '~/components/form/Form';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
import { Auth } from '~/utils/auth';
import { createLoader } from '~/utils/createLoader';
import { navigate } from '~/utils/navigate';
import { resetLoginRedirect } from '~/utils/requests';
import { Req } from '~/utils/requests/Req';

export interface LoginPayload {
	username: string;
	password: string;
	remember: boolean;
}

export interface RegisterPayload {
	username: string;
	password: string;
	passwordConfirm: string;
}

function LoginForm({ setRegister }: { setRegister: () => void }) {
	const { control, handleSubmit } = useForm<LoginPayload>();

	const loading = useStateNamed(false);

	const onSubmit = async (data: LoginPayload) => {
		loading.set(true);
		const { error } = await Req.login(data.username, data.password, data.remember);
		loading.set(false);
		if (error === null) {
			resetLoginRedirect();
			Auth.clearCache();
			Toast.success('登录成功');
			navigate('/');
		} else {
			Toast.error(error);
		}
	};

	return (
		<>
			<form id="loginForm" className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
				<Form.StringInput name="username" label="用户名" required control={control} />
				<Form.StringInput
					name="password"
					type="password"
					label="密码"
					required
					control={control}
				/>
				<Controller
					name="remember"
					control={control}
					render={({ field }) => (
						<FormControlLabel
							control={<Checkbox {...field} />}
							label="7 天内保持登录状态"
						></FormControlLabel>
					)}
				/>
			</form>
			<div className="flex gap-3 items-center">
				<Button
					variant="contained"
					type="submit"
					form="loginForm"
					loading={loading.current}
				>
					登录
				</Button>
				<Button variant="text" onClick={setRegister}>
					注册
				</Button>
			</div>
		</>
	);
}

function RegisterForm({ setLogin }: { setLogin: () => void }) {
	const { control, handleSubmit } = useForm<RegisterPayload>();

	const loading = useStateNamed(false);

	const onSubmit = async (data: RegisterPayload) => {
		loading.set(true);
		const ok = await Req.register(data.username, data.password);
		loading.set(false);

		if (ok) {
			Toast.success('注册成功');
			setLogin();
		} else {
			Toast.error('用户名或密码不合要求');
		}
	};

	return (
		<>
			<form
				id="registerForm"
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				<Form.StringInput
					name="username"
					label="用户名"
					maxlength={12}
					minlength={4}
					control={control}
				/>
				<Form.StringInput
					name="password"
					type="password"
					control={control}
					maxlength={20}
					minlength={8}
					label="密码"
				/>
				<Form.StringInput
					name="passwordConfirm"
					control={control}
					label="确认密码"
					type="password"
					rules={{
						validate(value, formValues) {
							if (value !== formValues.password) return '两次密码不匹配';
							return undefined;
						}
					}}
				/>
			</form>
			<div className="flex gap-3 items-center">
				<Button
					loading={loading.current}
					type="submit"
					variant="contained"
					form="registerForm"
				>
					注册
				</Button>
				<Button variant="text" onClick={setLogin}>
					登录
				</Button>
			</div>
		</>
	);
}

export const lorLoader = createLoader(async args => {
	if (await Auth.isLoggedIn()) {
		Toast.info('你已经登录');
		throw redirect('/');
	}
	resetLoginRedirect();
});

export default function Lor() {
	const [type, setType] = useState<'login' | 'register'>('login');
	const registerHelpModal = useStateNamed(false);

	return (
		<>
			<div className="flex items-center justify-center h-dvh w-full">
				<Card>
					<CardContent>
						<div className="flex flex-col gap-7 w-[320px]">
							<div className="flex flex-col gap-1">
								<div className="flex">
									<h1 className="text-2xl">
										Player {type === 'register' ? 'Register' : 'Login'}
									</h1>
									<div className="flex-1" />
									{type === 'register' && (
										<Tooltip title="了解更多">
											<IconButton
												onClick={() => registerHelpModal.set(true)}
												className="absolute top-3 right-3"
											>
												<HelpCircleIcon size={16} />
											</IconButton>
										</Tooltip>
									)}
								</div>
								<p>玩家控制台{type === 'register' ? '注册' : '登入'}</p>
							</div>
							{type === 'login' ? (
								<LoginForm setRegister={() => setType('register')} />
							) : (
								<RegisterForm setLogin={() => setType('login')} />
							)}
						</div>
					</CardContent>
				</Card>
			</div>
			<Dialog open={registerHelpModal.current} onClose={() => registerHelpModal.set(false)}>
				<DialogTitle>关于控制台账号</DialogTitle>
				<DialogContent>
					<div className="prose">
						<p>
							在注册控制台账号之前，如果你有任何疑问，可以参考下面的内容。阅读完后，如仍有不清楚的地方，欢迎发送邮件到{' '}
							<a href="mailto:support@seatide.net">support@seatide.net</a> 咨询。
						</p>
						<h4>控制台简介</h4>
						<p>
							控制台是 Seatide
							玩家在游戏外部访问与控制服务器的专属平台，所有获取了白名单并绑定游戏账号的玩家，都可以免费使用控制台的大部分功能。
						</p>
						<div className="grid grid-cols-3 gap-3 not-prose">
							<HelpDialogCard
								icon={MessagesSquareIcon}
								iconClass="text-amber-600"
								title="Web 互通聊天"
								description="无需进入服务器，你可以直接在网页端向服务器中的玩家发送信息并展开交流。"
							/>
							<HelpDialogCard
								icon={CogIcon}
								iconClass="text-sky-700"
								title="服务器操作"
								description="服务器长期闲置会自动关闭。你可以根据需要自行开启。此操作没有限制，且自动化。"
							/>
							<HelpDialogCard
								icon={ChartBarBigIcon}
								iconClass="text-red-700"
								title="统计数据"
								description="你可以在这里访问、下载自己的游戏内统计数据，并且可自愿与他人共享或参与排名。"
							/>
						</div>
						<h4>数据安全声明</h4>
						<p>
							控制台在你的全程使用过程中，<strong>不会</strong>
							收集包括但不仅限于明文密码、IP
							地址、设备标识符等任何个人额外信息，唯一使用的 Cookie
							仅用于登录这一必要用途。为了你的数据安全，请确保在 HTTPS
							安全连接下使用控制台。
						</p>
						<h4>白名单与控制台功能</h4>
						<p>
							你需要获取白名单并在注册之后绑定你的游戏名才能体验控制台的全部功能。在未获取白名单之前，只有下列功能可供使用：
						</p>
						<ul>
							<li>查看服务器的 IP 地址、状态等</li>
							<li>发送使用反馈</li>
						</ul>
						<h4>注册用户名与密码要求</h4>
						<p>你所填写的用户名和密码必须符合下面的条件。</p>
						<ul>
							<li>
								用户名：不与其他用户名重复，不需要与游戏名相同，长度为 4~12
								个字符，仅可包含英文字母、数字、下划线。
							</li>
							<li>密码：长度为 8~20 个字符，必须包含英文字母、数字。</li>
						</ul>
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => registerHelpModal.set(false)}>关闭</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

function HelpDialogCard(props: {
	icon: LucideIcon;
	iconClass: string;
	title: string;
	description: string;
}) {
	const Icon = props.icon;
	return (
		<Card>
			<CardContent>
				<Icon size={24} className={props.iconClass} />
				<h3 className="mt-3 mb-2">{props.title}</h3>
				<p className="text-sm">{props.description}</p>
			</CardContent>
		</Card>
	);
}
