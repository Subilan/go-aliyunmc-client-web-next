import { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select';
import {
	ArrowLeftIcon,
	ArrowLeftToLineIcon,
	ArrowRightIcon,
	ArrowRightToLineIcon,
	ArrowUpIcon,
	ArrowDownIcon
} from 'lucide-react';
import { cn } from '~/lib/utils';

export interface Column<T> {
	id: string;
	label: string;
	render: (row: T) => React.ReactNode;
	sortable?: boolean;
	align?: 'left' | 'right' | 'center';
	/** Tailwind classes for responsive hiding, e.g. "hidden md:table-cell" */
	cellClassName?: string;
}

interface PaginatedTableProps<T> {
	columns: Column<T>[];
	rows: T[];
	getRowKey: (row: T, index: number) => string | number;
	total: number;
	page: number;
	pageSize: number;
	pageSizeOptions?: number[];
	sort?: string;
	order?: 'asc' | 'desc';
	loading?: boolean;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	onSortChange?: (sort: string, order: 'asc' | 'desc') => void;
}

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
	if (!active) return null;
	return direction === 'asc' ? (
		<ArrowUpIcon className="inline size-3 ml-0.5" />
	) : (
		<ArrowDownIcon className="inline size-3 ml-0.5" />
	);
}

function PaginationActions({
	count,
	page,
	rowsPerPage,
	disabled,
	onPageChange
}: {
	count: number;
	page: number;
	rowsPerPage: number;
	disabled?: boolean;
	onPageChange: (page: number) => void;
}) {
	const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
	const [value, setValue] = useState('');
	const [error, setError] = useState(false);

	const doJump = () => {
		const trimmed = value.trim();
		if (!trimmed) return;
		const num = Number(trimmed);
		if (!Number.isInteger(num) || num < 1 || num > totalPages) {
			setError(true);
			return;
		}
		setError(false);
		setValue('');
		onPageChange(num - 1);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') doJump();
	};

	return (
		<div className="flex items-center ml-3">
			<Button
				variant="ghost"
				size="icon-xs"
				disabled={disabled || page === 0}
				onClick={() => onPageChange(0)}
				aria-label="first page"
			>
				<ArrowLeftToLineIcon data-icon="inline-start" />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				disabled={disabled || page === 0}
				onClick={() => onPageChange(page - 1)}
				aria-label="previous page"
			>
				<ArrowLeftIcon data-icon="inline-start" />
			</Button>
			<Input
				className="mx-0.5 w-[52px] min-w-[52px] shrink-0 text-center text-xs h-7 px-1"
				value={value}
				disabled={disabled}
				onChange={e => {
					setValue(e.target.value);
					setError(false);
				}}
				onKeyDown={handleKeyDown}
				onBlur={doJump}
				placeholder={`${page + 1}/${totalPages}`}
				inputMode="numeric"
				pattern="[0-9]*"
			/>
			<Button
				variant="ghost"
				size="icon-xs"
				disabled={disabled || page >= totalPages - 1}
				onClick={() => onPageChange(page + 1)}
				aria-label="next page"
			>
				<ArrowRightIcon data-icon="inline-start" />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				disabled={disabled || page >= totalPages - 1}
				onClick={() => onPageChange(totalPages - 1)}
				aria-label="last page"
			>
				<ArrowRightToLineIcon data-icon="inline-start" />
			</Button>
		</div>
	);
}

export default function PaginatedTable<T>({
	columns,
	rows,
	getRowKey,
	total,
	page,
	pageSize,
	pageSizeOptions = [5, 10, 15, 20],
	sort,
	order,
	loading = false,
	onPageChange,
	onPageSizeChange,
	onSortChange
}: PaginatedTableProps<T>) {
	const handleSort = (columnId: string) => {
		if (!onSortChange) return;
		if (sort === columnId) {
			onSortChange(columnId, order === 'asc' ? 'desc' : 'asc');
		} else {
			onSortChange(columnId, 'desc');
		}
	};

	return (
		<div className="border rounded-lg bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map(col => (
							<TableHead
								key={col.id}
								className={cn(
									col.align === 'center' && 'text-center',
									col.align === 'right' && 'text-right',
									col.cellClassName
								)}
							>
								{col.sortable && onSortChange ? (
									<button
										type="button"
										className="inline-flex items-center hover:text-foreground cursor-pointer"
										disabled={loading}
										onClick={() => handleSort(col.id)}
									>
										{col.label}
										<SortIcon
											active={sort === col.id}
											direction={sort === col.id ? order! : 'asc'}
										/>
									</button>
								) : (
									col.label
								)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading
						? Array.from({ length: pageSize }).map((_, i) => (
								<TableRow key={`skel-${i}`}>
									<TableCell colSpan={columns.length}>
										<div className="h-4 bg-muted rounded animate-pulse" />
									</TableCell>
								</TableRow>
							))
						: rows.length === 0
							? (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center">
										<span className="text-muted-foreground py-8 block">暂无数据</span>
									</TableCell>
								</TableRow>
							)
							: rows.map((row, i) => (
								<TableRow key={getRowKey(row, i)}>
									{columns.map(col => (
										<TableCell
											key={col.id}
											className={cn(
												col.align === 'center' && 'text-center',
												col.align === 'right' && 'text-right',
												col.cellClassName
											)}
										>
											{col.render(row)}
										</TableCell>
									))}
								</TableRow>
							))}
				</TableBody>
			</Table>
			<div className="flex items-center justify-between px-2 py-1.5 border-t">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>每页</span>
					<Select
						value={String(pageSize)}
						onValueChange={v => onPageSizeChange(Number(v))}
						disabled={loading}
					>
						<SelectTrigger size="sm" className="h-7 w-[58px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{pageSizeOptions.map(n => (
									<SelectItem key={n} value={String(n)}>
										{n}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<span className="hidden sm:inline">
						{total} 条
					</span>
				</div>
				<PaginationActions
					count={total}
					page={page}
					rowsPerPage={pageSize}
					disabled={loading}
					onPageChange={onPageChange}
				/>
			</div>
		</div>
	);
}
