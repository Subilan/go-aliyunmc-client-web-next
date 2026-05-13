import { isRouteErrorResponse, Scripts, ScrollRestoration, useRouteError } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import type { Route } from './+types/root';
import './app.css';
import toast, { Toaster } from 'react-hot-toast';
import { createTheme, SnackbarContent, ThemeProvider } from '@mui/material';
import { AlertCircleIcon, CheckIcon, InfoIcon } from 'lucide-react';
import Footer from '~/footer';
import { router } from '~/routes';
import { createRoot } from 'react-dom/client';

export const Toast = {
	run(title: string, kind: 'success' | 'error' | 'info' = 'info', timeout = 3000) {
		toast.custom(
			t => {
				return (
					<SnackbarContent
						style={{
							animation: t.visible ? 'FadeIn .2s' : 'FadeOut .2s ease forwards',
							fontFamily: 'var(--font-sans)'
						}}
						message={
							<div className="flex items-center gap-2">
								{kind === 'error' && <AlertCircleIcon size={16} />}
								{kind === 'success' && <CheckIcon size={16} />}
								{kind === 'info' && <InfoIcon size={16} />}
								{title}
							</div>
						}
					/>
				);
			},
			{
				duration: timeout,
				removeDelay: 200
			}
		);
	},
	success(title: string, timeout = 3000) {
		this.run(title, 'success', timeout);
	},
	error(title: string, timeout = 3000) {
		this.run(title, 'error', timeout);
	},
	info(title: string, timeout = 3000) {
		this.run(title, 'info', timeout);
	}
};

createRoot(document.getElementById('root')!).render(
	<>
		<ThemeProvider
			theme={createTheme({
				shape: {
					borderRadius: 10
				},
				typography: {
					fontFamily: 'var(--font-sans)'
				},
				palette: {
					primary: {
						main: '#1e88e5',
						light: '#2979ff',
						dark: '#1565c0',
						contrastText: '#fff'
					}
				}
			})}
		>
			<RouterProvider router={router} />
		</ThemeProvider>
		<Toaster position="top-center" />
		<Footer />
	</>
);

export function ErrorBoundary() {
	const error = useRouteError();
	let jackpot = window.innerWidth > 1000 && Math.random() > 0.99;
	let message = 'O' + 'o'.repeat(jackpot ? 100 : Math.round(Math.random() * 8) + 1) + 'ps!';
	let details = '此页面遇到了问题，请联系管理员。';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		details =
			error.status === 404 ? '此页面不存在，请检查 URL 拼写' : error.statusText || details;
	} else if (error && error instanceof Error) {
		if (error.message.trim() === 'Failed to fetch') {
			details = '我们暂时无法连接到控制台，请稍候再试';
		} else {
			details = error.message;
			stack = error.stack;
		}
	}

	return (
		<div className="h-dvh w-dvw flex items-center justify-center">
			<main className="pt-16 p-4 max-w-[1000px]">
				<h1
					className={`text-3xl wrap-break-word mb-2 ${message.startsWith('O') && message.endsWith('ps!') ? 'italic' : ''}`}
				>
					{message}
				</h1>
				<p className="text-xl">{details}</p>
				{jackpot && (
					<p className="text-neutral-300">
						（你抽到了 1% 概率的隐藏款！请联系服主领取奖励）
					</p>
				)}
				{stack && (
					<pre className="w-full p-4 overflow-x-auto">
						<code>{stack}</code>
					</pre>
				)}
			</main>
		</div>
	);
}
