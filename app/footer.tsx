export default function Footer() {
	return (
		<footer className="bg-neutral-800 p-10 text-white">
			<div className="grid grid-cols-3 gap-5">
				<div className="flex flex-col">
					<div className="text-3xl mb-3">TiLab</div>
					<p className="text-neutral-400 max-w-[400px] mb-1">
						为 Seatide（潮汐）Minecraft 服务器玩家设计的游戏信息中心。
					</p>
					<p className="text-sm text-neutral-500">
						由{' '}
						<a href="https://github.com/Subilan/go-aliyunmc" target="_blank">
							go-aliyunmc
						</a>{' '}
						强力驱动 ⚡
					</p>
				</div>
			</div>
		</footer>
	);
}
