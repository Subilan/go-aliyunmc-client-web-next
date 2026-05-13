import { useLoaderData, type LoaderFunction, type LoaderFunctionArgs } from 'react-router';

export function createLoader<T>(loader: (args: LoaderFunctionArgs) => Promise<T>): {
	itself: LoaderFunction;
	get: () => T;
} {
	return {
		itself: loader,
		get: () => {
			const data = useLoaderData() as T | undefined;
			if (data === undefined) {
				throw new Error('Loader data is undefined');
			}
			return data;
		}
	};
}
