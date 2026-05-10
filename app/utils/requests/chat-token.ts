import { get } from '~/utils/requests';

interface ChatTokenResponse {
	token: string;
	playername: string;
}

export default function getChatToken() {
	return get<ChatTokenResponse>('/user/chat-token');
}
