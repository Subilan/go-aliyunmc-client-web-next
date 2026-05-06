import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration
} from 'react-router';

import type { Route } from './+types/root';
import './app.css';
import toast, { Toaster } from 'react-hot-toast';
import { createTheme, SnackbarContent, ThemeProvider } from '@mui/material';
import { AlertCircleIcon, CheckIcon, InfoIcon } from 'lucide-react';
import Footer from '~/footer';

export const Toast = {
	run(title: string, desc?: string, kind: 'success' | 'error' | 'info' = 'info', timeout = 3000) {
		toast.custom(
			t => {
				return (
					<SnackbarContent
						style={{
							animation: t.visible ? 'FadeIn .2s' : 'FadeOut .2s ease forwards'
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
	success(title: string, desc?: string, timeout = 3000) {
		this.run(title, desc, 'success', timeout);
	},
	error(title: string, desc?: string, timeout = 3000) {
		this.run(title, desc, 'error', timeout);
	},
	info(title: string, desc?: string, timeout = 3000) {
		this.run(title, desc, 'info', timeout);
	}
};

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<ThemeProvider theme={createTheme({
					shape: {
						borderRadius: 10
					},
					typography: {
						fontFamily: 'var(--font-sans)',
					},
					palette: {
						primary: {
							main: '#1e88e5',
							light: '#2979ff',
							dark: '#1565c0',
							contrastText: '#fff'
						}
					}
				})}>{children}</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
				<Toaster position="top-center" />
				<Footer/>
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
