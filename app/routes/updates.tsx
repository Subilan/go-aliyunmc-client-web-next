import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Card, CardContent } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Spinner } from '~/components/ui/spinner';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Label } from '~/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog';
import { HeartIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Remark } from 'react-remark';
import EmptyState, { LoadingEmptyState } from '~/components/empty-state';
import { useLocation } from 'react-router';
import PageHeader from '~/components/page-header';
import { UserContext } from '~/contexts/user';
import { PAGE_NAME_UPDATES } from '~/consts/page-names';
import { Toast } from '~/root';
import {
	categoryText,
	createChangelog,
	deleteChangelog,
	getChangelogs,
	toggleLike,
	updateChangelog,
	type ChangelogItem
} from '~/utils/requests/changelog';
import { Times } from '~/utils/times';

interface ChangelogFormData {
	title: string;
	body: string;
	category: 'platform' | 'server';
}

function groupByMonth(items: ChangelogItem[]) {
	const map = new Map<string, ChangelogItem[]>();
	for (const item of items) {
		const key = Times.formatDate(item.created_at, 'YYYY 年 M 月');
		const group = map.get(key);
		if (group) {
			group.push(item);
		} else {
			map.set(key, [item]);
		}
	}
	return map;
}

export default function Updates() {
	const user = useContext(UserContext);
	const canEdit = user?.role === 'operator' || user?.role === 'superuser';

	const [items, setItems] = useState<ChangelogItem[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [selected, setSelected] = useState<ChangelogItem | null>(null);
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState<ChangelogItem | null>(null);
	const [deleting, setDeleting] = useState<ChangelogItem | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const location = useLocation();
	const pendingOpenId = (location.state as { openId?: number } | null)?.openId;
	const autoOpenedRef = useRef(false);

	const createForm = useForm<ChangelogFormData>({
		defaultValues: { title: '', body: '', category: 'platform' }
	});
	const editForm = useForm<ChangelogFormData>();

	const fetchPage = useCallback(async (p: number) => {
		const isFirst = p === 1;
		if (isFirst) setLoading(true);
		else setLoadingMore(true);

		const { data, error: err } = await getChangelogs({ page: p, pageSize: 20, sortBy: 'desc' });

		if (data) {
			const incoming = data.items ?? [];
			setItems(prev => (isFirst ? incoming : [...prev, ...incoming]));
			setTotal(data.total);
			setPage(p);
			setError(null);
		} else {
			if (isFirst) setError(err ?? '加载失败');
			else Toast.error(err ?? '加载失败');
		}

		setLoading(false);
		setLoadingMore(false);
	}, []);

	useEffect(() => {
		fetchPage(1);
	}, [fetchPage]);

	useEffect(() => {
		if (selected) {
			const updated = items.find(item => item.id === selected.id);
			if (updated) setSelected(updated);
		}
	}, [items, selected?.id]);

	useEffect(() => {
		if (!autoOpenedRef.current && pendingOpenId && items.length > 0) {
			const item = items.find(i => i.id === pendingOpenId);
			if (item) {
				setSelected(item);
				autoOpenedRef.current = true;
			}
		}
	}, [items, pendingOpenId]);

	const handleLike = async (id: number) => {
		setItems(prev =>
			prev.map(item => {
				if (item.id !== id) return item;
				return {
					...item,
					liked: !item.liked,
					like_count: item.liked ? item.like_count - 1 : item.like_count + 1
				};
			})
		);

		const { data } = await toggleLike(id);
		if (data) {
			setItems(prev =>
				prev.map(item => {
					if (item.id !== id) return item;
					return { ...item, liked: data.liked, like_count: data.like_count };
				})
			);
		}
	};

	const handleCreate = async (formData: ChangelogFormData) => {
		setSubmitting(true);
		const { error: err } = await createChangelog(formData);
		setSubmitting(false);
		if (err) {
			Toast.error(err);
			return;
		}
		Toast.success('创建成功');
		setCreating(false);
		createForm.reset();
		fetchPage(1);
	};

	const handleUpdate = async (formData: ChangelogFormData) => {
		if (!editing) return;
		setSubmitting(true);
		const { error: err } = await updateChangelog(editing.id, formData);
		setSubmitting(false);
		if (err) {
			Toast.error(err);
			return;
		}
		Toast.success('更新成功');
		setItems(prev =>
			prev.map(item => (item.id === editing.id ? { ...item, ...formData } : item))
		);
		setEditing(null);
	};

	const handleDelete = async () => {
		if (!deleting) return;
		const ok = await deleteChangelog(deleting.id);
		if (!ok) {
			Toast.error('删除失败');
			return;
		}
		Toast.success('已删除');
		setItems(prev => prev.filter(item => item.id !== deleting.id));
		setTotal(prev => prev - 1);
		setDeleting(null);
	};

	const grouped = groupByMonth(items);
	const hasMore = items.length < total;

	return (
		<>
			<PageHeader
				actions={
					canEdit && (
						<Button
							onClick={() => {
								createForm.reset({ title: '', body: '', category: 'platform' });
								setCreating(true);
							}}
						>
							<PlusIcon data-icon="inline-start" />
							发布
						</Button>
					)
				}
			>
				{PAGE_NAME_UPDATES}
			</PageHeader>

			{loading ? (
				<LoadingEmptyState className='py-20' />
			) : error ? (
				<EmptyState
					className="py-20"
					description={<span className="text-sm">{error}</span>}
					action={
						<Button variant="outline" onClick={() => fetchPage(1)}>
							重试
						</Button>
					}
				/>
			) : grouped.size === 0 ? (
				<EmptyState
					className="py-20"
					description={<span className="text-sm">暂无更新日志</span>}
				/>
			) : (
				<>
					{[...grouped.entries()].map(([month, updates]) => (
						<section key={month} className="mb-10">
							<h2 className="text-2xl font-bold mb-5">{month}</h2>
							<div className="flex flex-col gap-3">
								{updates.map(update => (
									<Card
										key={update.id}
										className="cursor-pointer hover:bg-muted/50 transition-colors"
										onClick={() => setSelected(update)}
									>
										<CardContent>
											<div className="flex items-start justify-between gap-4 mb-2">
												<h3 className="text-xl font-medium leading-relaxed">
													{update.title}
												</h3>
												<Badge variant="outline" className="shrink-0">
													{categoryText(update.category)}
												</Badge>
											</div>
											<div className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
												<Remark>{update.body}</Remark>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-muted-foreground text-sm">
													{Times.formatDate(
														update.created_at,
														'M 月 D 日'
													)}
												</span>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="sm"
														className={
															update.liked
																? 'text-red-600'
																: 'text-muted-foreground'
														}
														onMouseDown={e => e.stopPropagation()}
														onClick={e => {
															e.stopPropagation();
															handleLike(update.id);
														}}
													>
														<HeartIcon
															data-icon="inline-start"
															fill={
																update.liked
																	? 'currentColor'
																	: 'none'
															}
														/>
														{update.like_count}
													</Button>

													{canEdit && (
														<>
															<Button
																variant="ghost"
																size="icon-xs"
																className="text-muted-foreground hover:text-foreground ml-2"
																onMouseDown={e =>
																	e.stopPropagation()
																}
																onClick={e => {
																	e.stopPropagation();
																	editForm.reset({
																		title: update.title,
																		body: update.body,
																		category:
																			update.category
																	});
																	setEditing(update);
																}}
															>
																<PencilIcon data-icon="inline-start" />
															</Button>
															<Button
																variant="ghost"
																size="icon-xs"
																className="text-muted-foreground hover:text-red-500"
																onMouseDown={e =>
																	e.stopPropagation()
																}
																onClick={e => {
																	e.stopPropagation();
																	setDeleting(update);
																}}
															>
																<Trash2Icon data-icon="inline-start" />
															</Button>
														</>
													)}
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</section>
					))}

					{hasMore && (
						<div className="flex justify-center mt-6">
							<Button
								variant="outline"
								onClick={() => fetchPage(page + 1)}
								disabled={loadingMore}
							>
								{loadingMore && <Spinner data-icon="inline-start" />}
								{loadingMore ? '加载中...' : '加载更多'}
							</Button>
						</div>
					)}
				</>
			)}

			{/* Detail dialog */}
			<Dialog open={selected !== null} onOpenChange={v => !v && setSelected(null)}>
				{selected && (
					<DialogContent className="sm:max-w-lg">
						<DialogHeader>
							<div className="flex items-center gap-3">
								<DialogTitle>{selected.title}</DialogTitle>
								<Badge variant="outline" className="shrink-0">
									{categoryText(selected.category)}
								</Badge>
							</div>
						</DialogHeader>
						<div className="prose text-base leading-relaxed text-muted-foreground max-h-[70vh] overflow-y-auto pe-1">
							<Remark>{selected.body}</Remark>
						</div>
						<DialogFooter>
							<div className="flex items-center gap-0.5">
								<Button
									size="sm"
									variant="ghost"
									className={
										selected.liked ? 'text-red-600' : 'text-muted-foreground'
									}
									onClick={() => handleLike(selected.id)}
								>
									<HeartIcon
										data-icon="inline-start"
										fill={selected.liked ? 'currentColor' : 'none'}
									/>
									{selected.like_count}
								</Button>
							</div>
							<Button variant="outline" onClick={() => setSelected(null)}>关闭</Button>
						</DialogFooter>
					</DialogContent>
				)}
			</Dialog>

			{/* Create dialog */}
			<Dialog open={creating} onOpenChange={v => setCreating(v)}>
				<DialogContent className="sm:max-w-lg">
					<form onSubmit={createForm.handleSubmit(handleCreate)} className="flex flex-col gap-6">
						<DialogHeader>
							<DialogTitle>新增更新日志</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<Controller
								name="title"
								control={createForm.control}
								rules={{ required: '标题不能为空' }}
								render={({ field, fieldState }) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="create-title">标题</Label>
										<Input
											id="create-title"
											{...field}
											aria-invalid={!!fieldState.error}
										/>
										{fieldState.error?.message && (
											<p className="text-xs text-destructive">{fieldState.error.message}</p>
										)}
									</div>
								)}
							/>
							<Controller
								name="body"
								control={createForm.control}
								rules={{ required: '正文不能为空' }}
								render={({ field, fieldState }) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="create-body">正文</Label>
										<Textarea
											id="create-body"
											{...field}
											rows={5}
											aria-invalid={!!fieldState.error}
										/>
										{fieldState.error?.message && (
											<p className="text-xs text-destructive">{fieldState.error.message}</p>
										)}
									</div>
								)}
							/>
							<Controller
								name="category"
								control={createForm.control}
								render={({ field }) => (
									<ToggleGroup
										type="single"
										value={field.value}
										onValueChange={v => v && field.onChange(v)}
										className="w-full"
									>
										<ToggleGroupItem value="platform" className="flex-1">控制台更新</ToggleGroupItem>
										<ToggleGroupItem value="server" className="flex-1">服务器更新</ToggleGroupItem>
									</ToggleGroup>
								)}
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setCreating(false)} disabled={submitting}>
								取消
							</Button>
							<Button type="submit" disabled={submitting}>
								{submitting && <Spinner data-icon="inline-start" />}
								{submitting ? '创建中...' : '创建'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit dialog */}
			<Dialog open={editing !== null} onOpenChange={v => !v && setEditing(null)}>
				<DialogContent className="sm:max-w-lg">
					<form onSubmit={editForm.handleSubmit(handleUpdate)} className="flex flex-col gap-6">
						<DialogHeader>
							<DialogTitle>编辑更新日志</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<Controller
								name="title"
								control={editForm.control}
								rules={{ required: '标题不能为空' }}
								render={({ field, fieldState }) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="edit-title">标题</Label>
										<Input
											id="edit-title"
											{...field}
											aria-invalid={!!fieldState.error}
										/>
										{fieldState.error?.message && (
											<p className="text-xs text-destructive">{fieldState.error.message}</p>
										)}
									</div>
								)}
							/>
							<Controller
								name="body"
								control={editForm.control}
								rules={{ required: '正文不能为空' }}
								render={({ field, fieldState }) => (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor="edit-body">正文</Label>
										<Textarea
											id="edit-body"
											{...field}
											rows={5}
											aria-invalid={!!fieldState.error}
										/>
										{fieldState.error?.message && (
											<p className="text-xs text-destructive">{fieldState.error.message}</p>
										)}
									</div>
								)}
							/>
							<Controller
								name="category"
								control={editForm.control}
								render={({ field }) => (
									<ToggleGroup
										type="single"
										value={field.value}
										onValueChange={v => v && field.onChange(v)}
										className="w-full"
									>
										<ToggleGroupItem value="platform" className="flex-1">控制台</ToggleGroupItem>
										<ToggleGroupItem value="server" className="flex-1">服务器</ToggleGroupItem>
									</ToggleGroup>
								)}
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setEditing(null)} disabled={submitting}>
								取消
							</Button>
							<Button type="submit" disabled={submitting}>
								{submitting && <Spinner data-icon="inline-start" />}
								{submitting ? '保存中...' : '保存'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog open={deleting !== null} onOpenChange={v => !v && setDeleting(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认删除</DialogTitle>
						<DialogDescription>
							确定要删除更新日志"{deleting?.title}"吗？此操作不可撤销。
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleting(null)}>取消</Button>
						<Button variant="destructive" onClick={handleDelete}>删除</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
