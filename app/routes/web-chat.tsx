import { useCallback, useContext, useEffect, useRef } from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { MessagesSquareIcon, SendIcon, TriangleAlertIcon, WifiOffIcon } from 'lucide-react';
import type { MetaArgs } from 'react-router';
import PageHeader from '~/components/page-header';
import { PAGE_NAME_WEB_CHAT } from '~/consts/page-names';
import { UserContext } from '~/contexts/user';
import useStateNamed from '~/hooks/useStateNamed';
import getChatToken from '~/utils/requests/chat-token';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { navigate } from '~/utils/navigate';

const WS_HOST = 'play.seatide.net';
const WS_PORT = '33795';

interface ChatMessage {
	type: string;
	source: string;
	player: string;
	content: string;
	timestamp: number;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function meta({}: MetaArgs) {
	return [{ title: PAGE_NAME_WEB_CHAT + ' - Seatide' }];
}

function WebChatInfo() {
	return (
		<>
			<p>
				Web
				聊天页面提供了与服务器之间的双向交流功能，你可以在这里向服务器发送消息，也可以查看服务器内玩家发送的消息。在这里发送信息时，你的名称与绑定的游戏名保持一致。你需要拥有白名单才能使用此功能。
			</p>
			<p>从这里发送的内容以及服务器发送过来的内容在传输过程中均经过了 TLS 加密。</p>
		</>
	);
}

export default function WebChat() {
	const user = useContext(UserContext);
	const uuid = user?.whitelist_uuid;
	const playername = useStateNamed('');

	const messageText = useStateNamed('');
	const status = useStateNamed<ConnectionStatus>('connecting');
	const messages = useStateNamed<ChatMessage[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	const chatLogRef = useRef<HTMLPreElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);

	const scrollToBottom = () => {
		setTimeout(() => {
			if (chatLogRef.current) {
				chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
			}
		}, 50);
	};

	const doConnect = useCallback(async () => {
		if (!uuid) return;

		status.set('connecting');

		const { data, error } = await getChatToken();
		if (error || !data?.token) {
			status.set('disconnected');
			return;
		}

		playername.set(data.playername);

		const ws = new WebSocket(`wss://${WS_HOST}:${WS_PORT}/?token=${data.token}`);
		wsRef.current = ws;

		ws.onopen = () => {
			if (wsRef.current === ws) {
				status.set('connected');
			}
		};

		ws.onmessage = event => {
			try {
				const msg: ChatMessage = JSON.parse(event.data);
				messages.set(prev => [...prev, msg]);
				scrollToBottom();
			} catch {
				// ignore unparseable messages
			}
		};

		ws.onclose = () => {
			if (wsRef.current === ws) {
				status.set('disconnected');
			}
		};
	}, [uuid]);

	const disconnect = useCallback(() => {
		const ws = wsRef.current;
		wsRef.current = null;
		if (ws) {
			ws.onopen = null;
			ws.onclose = null;
			ws.onerror = null;
			ws.onmessage = null;
			if (ws.readyState === WebSocket.OPEN) {
				ws.close();
			} else if (ws.readyState === WebSocket.CONNECTING) {
				ws.onopen = () => ws.close();
			}
		}
		status.set('disconnected');
	}, []);

	useEffect(() => {
		if (!uuid) {
			status.set('disconnected');
			return;
		}

		doConnect();

		const handleVisibility = () => {
			if (document.hidden) {
				disconnect();
			} else {
				doConnect();
			}
		};

		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibility);
			disconnect();
		};
	}, [uuid, doConnect, disconnect]);

	const sendMessage = () => {
		const text = messageText.current.trim();
		if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !uuid) return;

		const msg: ChatMessage = {
			type: 'chat',
			source: 'web',
			player: playername.current,
			content: text,
			timestamp: Math.floor(Date.now() / 1000)
		};

		wsRef.current.send(
			JSON.stringify({
				player: uuid,
				content: text
			})
		);
		messages.set(prev => [...prev, msg]);
		messageText.set('');
		messageInputRef.current?.focus();
		scrollToBottom();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const formatTime = (ts: number) => {
		const d = new Date(ts * 1000);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const sourcePrefix = (source: string) => {
		if (source === 'minecraft') return { text: '[MC]', color: 'text-amber-400' };
		if (source === 'web') return { text: '[Web]', color: 'text-sky-400' };
		if (source === 'system') return { text: '[System]', color: 'text-red-400' };
		return { text: `[${source}]`, color: 'text-neutral-400' };
	};

	const connected = status.current === 'connected';
	const connecting = status.current === 'connecting';

	const chatInput = (
		<div className="fixed w-full left-0 bottom-0 p-5 md:p-0 bg-background border-t md:border-t-0 md:bg-auto md:w-auto md:static grid grid-cols-[1fr_auto] gap-5 items-center">
			<Input
				ref={messageInputRef}
				placeholder={
					connected
						? '输入消息，按 Enter 发送'
						: connecting
							? '正在连接...'
							: '未连接服务器'
				}
				value={messageText.current}
				onChange={e => messageText.set(e.target.value)}
				onKeyDown={handleKeyDown}
				disabled={!connected}
			/>
			<Button
				onClick={sendMessage}
				disabled={!connected || !messageText.current.trim()}
			>
				<SendIcon data-icon="inline-start" />
				发送
			</Button>
		</div>
	);

	return (
		<>
			<PageHeader info={WebChatInfo()}>{PAGE_NAME_WEB_CHAT}</PageHeader>
			<div className="flex gap-5 flex-col">
				{chatInput}
				{uuid ? (
					<Card className="flex-1 flex flex-col min-h-0">
						<CardContent className="flex-1 flex flex-col min-h-0 p-4">
							{connecting && messages.current.length === 0 && (
								<LoadingEmptyState className="h-[50vh]" description="正在连接" />
							)}
							{status.current === 'disconnected' && messages.current.length === 0 && (
								<EmptyState
									className="h-[50vh]"
									icon={WifiOffIcon}
									description="连接已断开"
									action={
										<Button size="sm" variant="outline" onClick={doConnect}>
											重新连接
										</Button>
									}
								/>
							)}
							{connected &&
								(messages.current.length > 0 ? (
									<pre
										ref={chatLogRef}
										className="flex-1 h-[50vh] overflow-y-auto font-mono text-sm leading-relaxed m-0 whitespace-pre-wrap break-all"
									>
										<code>
											{messages.current.map(msg => {
												if (msg.type === 'error') {
													return `错误: ${msg.content}\n`;
												}
												const prefix = sourcePrefix(msg.source);
												const time = msg.timestamp
													? formatTime(msg.timestamp)
													: '';
												return `${time ? `[${time}] ` : ''}${prefix.text} ${msg.player}: ${msg.content}\n`;
											})}
										</code>
									</pre>
								) : (
									<EmptyState
										className="h-[50vh]"
										icon={MessagesSquareIcon}
										description="等待发送或接收到消息"
									/>
								))}
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent>
							<EmptyState
								className="h-[50vh]"
								layout="horizontal"
								icon={TriangleAlertIcon}
								iconClassName="text-amber-500"
								description="需要绑定游戏账号后才能使用 Web 聊天功能"
								action={
									<Button onClick={() => navigate('/profile')}>
										立即绑定
									</Button>
								}
							/>
						</CardContent>
					</Card>
				)}
			</div>
		</>
	);
}
