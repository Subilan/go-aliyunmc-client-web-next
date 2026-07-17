import type { LeaderboardEntry } from './game';

const MOCK_PLAYERS: { uuid: string; player_name: string }[] = [
	{ uuid: 'c8f1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c', player_name: 'Steve_Alex' },
	{ uuid: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', player_name: '方块达人' },
	{ uuid: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', player_name: 'Herobrine' },
	{ uuid: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', player_name: '矿工小王' },
	{ uuid: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', player_name: 'DreamChaser' },
	{ uuid: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', player_name: '建筑师Li' },
	{ uuid: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', player_name: '红石高手' },
	{ uuid: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', player_name: 'PixelNerd' },
];

/**
 * Deterministically shuffle players and assign values based on the metric key.
 * Same metric always produces the same leaderboard for visual consistency.
 */
function generateMockLeaderboard(metric: string): LeaderboardEntry[] {
	const seed = metric.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

	// Deterministic-ish shuffle using seeded sort
	const shuffled = [...MOCK_PLAYERS].sort((a, b) => {
		const ha = (a.uuid.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + seed) % 100;
		const hb = (b.uuid.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + seed) % 100;
		return hb - ha;
	});

	return shuffled.map((p, i) => {
		// Generate a plausible value that decreases with rank
		const rank = i + 1;
		const base = Math.floor((seed * 137 + 5000) % 90000);
		const value = Math.max(1, Math.floor(base / (rank * 0.7 + 0.3)));
		return {
			...p,
			value,
		};
	});
}

/**
 * Mock leaderboard API with simulated network delay (300–800ms).
 * Used only in dev mode for local validation.
 */
export async function getLeaderboardMock(metric: string) {
	const delay = 300 + Math.random() * 500;
	await new Promise(resolve => setTimeout(resolve, delay));

	return {
		data: generateMockLeaderboard(metric),
		error: null,
		status: 200,
	} as const;
}
