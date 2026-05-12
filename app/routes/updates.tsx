import { useCallback, useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	TextField,
	ToggleButton,
	ToggleButtonGroup
} from '@mui/material';
import { HeartIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Remark, useRemark } from 'react-remark';
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
							variant="contained"
							startIcon={<PlusIcon size={16} />}
							onClick={() => {
								createForm.reset({ title: '', body: '', category: 'platform' });
								setCreating(true);
							}}
						>
							发布
						</Button>
					)
				}
			>
				{PAGE_NAME_UPDATES}
			</PageHeader>

			{loading ? (
				<div className="flex justify-center py-20">
					<CircularProgress />
				</div>
			) : error ? (
				<div className="flex flex-col items-center gap-4 py-20">
					<p className="text-neutral-500 text-sm">{error}</p>
					<Button variant="outlined" onClick={() => fetchPage(1)}>
						重试
					</Button>
				</div>
			) : grouped.size === 0 ? (
				<div className="flex justify-center py-20">
					<p className="text-neutral-500 text-sm">暂无更新日志</p>
				</div>
			) : (
				<>
					{[...grouped.entries()].map(([month, updates]) => (
						<section key={month} className="mb-10">
							<h2 className="text-2xl font-bold mb-5">{month}</h2>
							<div className="flex flex-col gap-3">
								{updates.map(update => (
									<Card key={update.id} variant="outlined">
										<CardActionArea
											component="div"
											onClick={() => setSelected(update)}
										>
											<CardContent>
												<div className="flex items-start justify-between gap-4 mb-2">
													<h3 className="text-xl font-medium leading-relaxed">
														{update.title}
													</h3>
													<Chip
														label={categoryText(update.category)}
														size="small"
														variant="outlined"
														className="shrink-0"
													/>
												</div>
												<div className="text-neutral-500 text-sm mb-4 leading-relaxed line-clamp-3">
													<Remark>{update.body}</Remark>
												</div>
												<div className="flex items-center justify-between">
													<span className="text-neutral-500 text-sm">
														{Times.formatDate(
															update.created_at,
															'M 月 D 日'
														)}
													</span>
													<div className="flex items-center gap-1">
														<Button
															color="error"
															onMouseDown={e => e.stopPropagation()}
															onClick={e => {
																e.stopPropagation();
																handleLike(update.id)
															}}
															className={
																update.liked
																	? 'text-red-600!'
																	: 'text-neutral-400!'
															}
															startIcon={
																<HeartIcon
																	size={16}
																	fill={
																		update.liked
																			? 'currentColor'
																			: 'none'
																	}
																/>
															}
														>
															{update.like_count}
														</Button>

														{canEdit && (
															<>
																<IconButton
																	className="text-neutral-400 hover:text-neutral-600 ml-2"
																	onMouseDown={e => e.stopPropagation()}
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
																	<PencilIcon size={14} />
																</IconButton>
																<IconButton
																	className="text-neutral-400 hover:text-red-500"
																	onMouseDown={e => e.stopPropagation()}
																	onClick={e => {
																		e.stopPropagation();
																		setDeleting(update);
																	}}
																>
																	<Trash2Icon size={14} />
																</IconButton>
															</>
														)}
													</div>
												</div>
											</CardContent>
										</CardActionArea>
									</Card>
								))}
							</div>
						</section>
					))}

					{hasMore && (
						<div className="flex justify-center mt-6">
							<Button
								variant="outlined"
								onClick={() => fetchPage(page + 1)}
								disabled={loadingMore}
							>
								{loadingMore ? '加载中...' : '加载更多'}
							</Button>
						</div>
					)}
				</>
			)}

			{/* Detail dialog */}
			<Dialog
				open={selected !== null}
				onClose={() => setSelected(null)}
				maxWidth="sm"
				fullWidth
			>
				{selected && (
					<>
						<DialogTitle className="flex items-center justify-between gap-4">
							<span>{selected.title}</span>
							<Chip
								label={categoryText(selected.category)}
								size="small"
								variant="outlined"
								className="shrink-0"
							/>
						</DialogTitle>
						<DialogContent className="prose">
							<Remark>{selected.body}</Remark>
						</DialogContent>
						<DialogActions className="justify-between px-6">
							<div className="flex items-center gap-0.5">
								<IconButton
									size="small"
									onClick={() => handleLike(selected.id)}
									className={
										selected.liked ? 'text-red-600!' : 'text-neutral-400!'
									}
								>
									<HeartIcon
										size={16}
										fill={selected.liked ? 'currentColor' : 'none'}
									/>
								</IconButton>
								<span className="text-neutral-500 text-sm">
									{selected.like_count}
								</span>
							</div>
							<Button onClick={() => setSelected(null)}>关闭</Button>
						</DialogActions>
					</>
				)}
			</Dialog>

			{/* Create dialog */}
			<Dialog open={creating} onClose={() => setCreating(false)} maxWidth="sm" fullWidth>
				<form onSubmit={createForm.handleSubmit(handleCreate)}>
					<DialogTitle>新增更新日志</DialogTitle>
					<DialogContent>
						<Controller
							name="title"
							control={createForm.control}
							rules={{ required: '标题不能为空' }}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									label="标题"
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
									fullWidth
									margin="normal"
								/>
							)}
						/>
						<Controller
							name="body"
							control={createForm.control}
							rules={{ required: '正文不能为空' }}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									label="正文"
									multiline
									minRows={5}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
									fullWidth
									margin="normal"
								/>
							)}
						/>
						<Controller
							name="category"
							control={createForm.control}
							render={({ field }) => (
								<ToggleButtonGroup
									value={field.value}
									onChange={(_, v) => v && field.onChange(v)}
									exclusive
									fullWidth
									className="mt-2"
								>
									<ToggleButton value="platform">控制台更新</ToggleButton>
									<ToggleButton value="server">服务器更新</ToggleButton>
								</ToggleButtonGroup>
							)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setCreating(false)} disabled={submitting}>
							取消
						</Button>
						<Button type="submit" variant="contained" disabled={submitting}>
							{submitting ? '创建中...' : '创建'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Edit dialog */}
			<Dialog
				open={editing !== null}
				onClose={() => setEditing(null)}
				maxWidth="sm"
				fullWidth
			>
				<form onSubmit={editForm.handleSubmit(handleUpdate)}>
					<DialogTitle>编辑更新日志</DialogTitle>
					<DialogContent>
						<Controller
							name="title"
							control={editForm.control}
							rules={{ required: '标题不能为空' }}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									label="标题"
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
									fullWidth
									margin="normal"
								/>
							)}
						/>
						<Controller
							name="body"
							control={editForm.control}
							rules={{ required: '正文不能为空' }}
							render={({ field, fieldState }) => (
								<TextField
									{...field}
									label="正文"
									multiline
									minRows={5}
									error={!!fieldState.error}
									helperText={fieldState.error?.message}
									fullWidth
									margin="normal"
								/>
							)}
						/>
						<Controller
							name="category"
							control={editForm.control}
							render={({ field }) => (
								<ToggleButtonGroup
									value={field.value}
									onChange={(_, v) => v && field.onChange(v)}
									exclusive
									fullWidth
									className="mt-2"
								>
									<ToggleButton value="platform">控制台</ToggleButton>
									<ToggleButton value="server">服务器</ToggleButton>
								</ToggleButtonGroup>
							)}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={() => setEditing(null)} disabled={submitting}>
							取消
						</Button>
						<Button type="submit" variant="contained" disabled={submitting}>
							{submitting ? '保存中...' : '保存'}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog
				open={deleting !== null}
				onClose={() => setDeleting(null)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>确认删除</DialogTitle>
				<DialogContent>
					<DialogContentText>
						确定要删除更新日志“{deleting?.title}”吗？此操作不可撤销。
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleting(null)}>取消</Button>
					<Button variant="contained" color="error" onClick={handleDelete}>
						删除
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
