import { useState } from 'react';
import {
	Box,
	IconButton,
	TextField,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
	TableSortLabel
} from '@mui/material';
import {
	ArrowLeftIcon,
	ArrowLeftToLineIcon,
	ArrowRightIcon,
	ArrowRightToLineIcon
} from 'lucide-react';

export interface Column<T> {
	id: string;
	label: string;
	render: (row: T) => React.ReactNode;
	sortable?: boolean;
	align?: 'left' | 'right' | 'center';
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
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	onSortChange?: (sort: string, order: 'asc' | 'desc') => void;
}

function PaginationActions({
	count,
	page,
	rowsPerPage,
	onPageChange
}: {
	count: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
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
		onPageChange(null, num - 1);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') doJump();
	};

	return (
		<div className="flex items-center ml-3">
			<IconButton
				size="small"
				disabled={page === 0}
				onClick={e => onPageChange(e, 0)}
				aria-label="first page"
			>
				<ArrowLeftToLineIcon size={16} />
			</IconButton>
			<IconButton
				size="small"
				disabled={page === 0}
				onClick={e => onPageChange(e, page - 1)}
				aria-label="previous page"
			>
				<ArrowLeftIcon size={16} />
			</IconButton>
			<TextField
				className="mx-0.5"
				value={value}
				onChange={e => {
					setValue(e.target.value);
					setError(false);
				}}
				onKeyDown={handleKeyDown}
				onBlur={doJump}
				error={error}
				placeholder={`${page + 1}/${totalPages}`}
				sx={{ width: 52, minWidth: 52, flexShrink: 0 }}
				slotProps={{
					input: { sx: { textAlign: 'center', px: 1, py: 0 } },
					htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', style: { padding: 0 } }
				}}
			/>
			<IconButton
				size="small"
				disabled={page >= totalPages - 1}
				onClick={e => onPageChange(e, page + 1)}
				aria-label="next page"
			>
				<ArrowRightIcon size={16} />
			</IconButton>
			<IconButton
				size="small"
				disabled={page >= totalPages - 1}
				onClick={e => onPageChange(e, totalPages - 1)}
				aria-label="last page"
			>
				<ArrowRightToLineIcon size={16} />
			</IconButton>
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
		<Paper variant="outlined">
			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow>
							{columns.map(col => (
								<TableCell key={col.id} align={col.align ?? 'left'}>
									{col.sortable && onSortChange ? (
										<TableSortLabel
											active={sort === col.id}
											direction={sort === col.id ? order : 'asc'}
											onClick={() => handleSort(col.id)}
										>
											{col.label}
										</TableSortLabel>
									) : (
										col.label
									)}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row, i) => (
							<TableRow key={getRowKey(row, i)} hover>
								{columns.map(col => (
									<TableCell key={col.id} align={col.align ?? 'left'}>
										{col.render(row)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				component="div"
				count={total}
				page={page}
				rowsPerPage={pageSize}
				rowsPerPageOptions={pageSizeOptions}
				onPageChange={(_, newPage) => onPageChange(newPage)}
				onRowsPerPageChange={e => onPageSizeChange(Number(e.target.value))}
				labelRowsPerPage="每页"
				ActionsComponent={PaginationActions}
			/>
		</Paper>
	);
}
