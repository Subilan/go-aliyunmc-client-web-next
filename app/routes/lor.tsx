import { Button, Checkbox, Form, InlineLoading, TextInput, Tile, ToastNotification } from '@carbon/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import useStateNamed from '~/hooks/useStateNamed';
import { Toast } from '~/root';
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
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<LoginPayload>();

	const loading = useStateNamed(false);

	const onSubmit = async (data: LoginPayload) => {
		loading.set(true);
		const ok = await Req.login(data.username, data.password);
		loading.set(false);
		if (ok) {
			Toast.success('登录成功');
		} else {
			Toast.error('用户名或密码错误');
		}
	};

	return (
		<>
			<Form id="loginForm" className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
				<TextInput
					id="username"
					labelText="用户名"
					autoComplete="off"
					required
					{...register('username')}
					invalid={!!errors['username']}
					invalidText={errors['username']?.message?.toString()}
				></TextInput>
				<TextInput
					id="password"
					labelText="密码"
					type="password"
					autoComplete="off"
					required
					{...register('password')}
					invalid={!!errors['password']}
					invalidText={errors['password']?.message?.toString()}
				></TextInput>
				<Checkbox id="remember" {...register('remember')} labelText="7 天内保持登录状态" />
			</Form>
			<div className="flex gap-3 items-center">
				<Button type="submit" form="loginForm" disabled={loading.current}>
					{loading.current ? '请稍等' : '登录'}
				</Button>
				<Button kind="ghost" onClick={setRegister}>
					注册
				</Button>
			</div>
		</>
	);
}

function RegisterForm({ setLogin }: { setLogin: () => void }) {
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm();

	const onSubmit = (data: any) => {
		console.log(data);
	};

	return (
		<>
			<Form
				id="registerForm"
				className="flex flex-col gap-3"
				onSubmit={handleSubmit(onSubmit)}
			>
				<TextInput
					id="username"
					labelText="用户名"
					autoComplete="off"
					required
					minLength={4}
					maxLength={12}
					{...register('username')}
					invalid={!!errors['username']}
					invalidText="无效用户名"
				></TextInput>
				<TextInput
					id="password"
					labelText="密码"
					minLength={8}
					maxLength={20}
					type="password"
					autoComplete="off"
					required
					{...register('password')}
					invalid={!!errors['password']}
					invalidText={errors['password']?.message?.toString()}
				></TextInput>
				<TextInput
					id="passwordConfirm"
					labelText="确认密码"
					type="password"
					autoComplete="off"
					required
					{...register('passwordConfirm', {
						validate(value, formValues) {
							if (formValues.password !== value) return '两次密码不匹配';
							return undefined;
						}
					})}
					invalid={!!errors['passwordConfirm']}
					invalidText={errors['passwordConfirm']?.message?.toString()}
				></TextInput>
			</Form>
			<div className="flex gap-3 items-center">
				<Button type="submit" form="registerForm">
					注册
				</Button>
				<Button kind="ghost" onClick={setLogin}>
					转到登录
				</Button>
			</div>
		</>
	);
}

export default function Lor() {
	const [type, setType] = useState<'login' | 'register'>('login');

	return (
		<div className="flex items-center justify-center h-dvh w-full">
			<Tile>
				<div className="flex flex-col gap-7 w-[320px]">
					<div className="flex flex-col gap-1">
						<h3>Player {type === 'register' ? 'Register' : 'Login'}</h3>
						<p>玩家控制台{type === 'register' ? '注册' : '登入'}</p>
					</div>
					{type === 'login' ? (
						<LoginForm setRegister={() => setType('register')} />
					) : (
						<RegisterForm setLogin={() => setType('login')} />
					)}
				</div>
			</Tile>
		</div>
	);
}
