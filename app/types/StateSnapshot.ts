export interface StateSnapshot<T> {
	Value: T;
	UpdatedAt: string;
	Error: string | null;
}
