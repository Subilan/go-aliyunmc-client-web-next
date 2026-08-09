import type { MetaArgs } from 'react-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
	CalendarIcon,
	CodeIcon,
	CpuIcon,
	ExternalLinkIcon,
	GitCommitIcon,
	GlobeIcon,
	MailIcon,
	TagIcon,
	type LucideIcon
} from 'lucide-react';
import PageHeader from '~/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { PAGE_NAME_ABOUT } from '~/consts/page-names';
import type { SystemInfo } from '~/utils/requests/system-info';
import { Req } from '~/utils/requests/Req';

declare const __FRONTEND_COMMIT__: string;

export function meta({}: MetaArgs) {
	return [{ title: PAGE_NAME_ABOUT + ' - Seatide' }];
}

function InfoRow({
	icon: Icon,
	label,
	value,
	mono = false
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 py-3">
			<span className="flex items-center gap-2 text-muted-foreground text-sm shrink-0">
				<Icon className="size-4" />
				{label}
			</span>
			<span
				className={cn(
					'text-right text-sm font-medium break-all',
					mono && 'font-mono text-[13px]'
				)}
			>
				{value}
			</span>
		</div>
	);
}

function LinkRow({
	href,
	external = false,
	children
}: {
	href: string;
	external?: boolean;
	children: ReactNode;
}) {
	if (external) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noreferrer"
				className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
			>
				<span className="flex items-center gap-2">{children}</span>
				<ExternalLinkIcon className="size-4 shrink-0" />
			</a>
		);
	}
	return (
		<Link
			to={href}
			className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
		>
			<span className="flex items-center gap-2">{children}</span>
			<ExternalLinkIcon className="size-4 shrink-0" />
		</Link>
	);
}

export default function About() {
	const [info, setInfo] = useState<SystemInfo | null>(null);

	useEffect(() => {
		Req.getSystemInfo().then(result => {
			if (result.error === null) {
				setInfo(result.data);
			}
		});
	}, []);

	return (
		<>
			<PageHeader>{PAGE_NAME_ABOUT}</PageHeader>

			<div className="flex flex-col gap-6">
				<section className="flex items-center justify-center py-14 text-center">
					<div>
						<h2 className="text-6xl font-recursive-casual tracking-tight">TiLab</h2>
						<p className="mt-3 text-lg text-muted-foreground">
							技术驱动的 Minecraft 服务器体验
						</p>
					</div>
				</section>

				<div className="flex flex-col gap-5">
					<Card>
						<CardHeader>
							<CardTitle>构建信息</CardTitle>
						</CardHeader>
						<CardContent className="divide-y divide-border">
							<InfoRow
								icon={TagIcon}
								label="版本"
								value={info?.version ?? '—'}
								mono
							/>
							<InfoRow
								icon={CodeIcon}
								label="Go 版本"
								value={info?.go_version ?? '—'}
								mono
							/>
							<InfoRow
								icon={CalendarIcon}
								label="构建时间"
								value={info?.build_time ?? '—'}
								mono
							/>
							<InfoRow
								icon={CpuIcon}
								label="构建平台"
								value={info?.platform ?? '—'}
								mono
							/>
						<InfoRow
							icon={GitCommitIcon}
							label="后端提交"
							value={info?.commit ?? '—'}
							mono
						/>
						<InfoRow
							icon={GitCommitIcon}
							label="前端提交"
							value={__FRONTEND_COMMIT__}
							mono
						/>
					</CardContent>
				</Card>

					<Card>
						<CardHeader>
							<CardTitle>相关链接</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-1 sm:grid-cols-2">
							<LinkRow href="https://seatide.net" external>
								<GlobeIcon className="size-4" />
								Seatide 官方网站
							</LinkRow>
							<LinkRow href="https://github.com/Subilan/go-aliyunmc" external>
								<CodeIcon className="size-4" />
								go-aliyunmc 源码
							</LinkRow>
							<LinkRow href="mailto:support@seatide.net" external>
								<MailIcon className="size-4" />
								support@seatide.net
							</LinkRow>
							<LinkRow href="/updates">
								<GlobeIcon className="size-4" />
								更新日志
							</LinkRow>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
