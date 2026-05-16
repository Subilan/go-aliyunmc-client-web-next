import { Outlet } from 'react-router';
import ProgressBar from '~/components/progress-bar';

export default function RootLayout() {
	return (
		<>
			<ProgressBar />
			<Outlet />
		</>
	);
}
