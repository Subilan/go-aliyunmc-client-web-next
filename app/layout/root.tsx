import { Outlet } from 'react-router';
import { TooltipProvider } from '~/components/ui/tooltip';
import ProgressBar from '~/components/progress-bar';

export default function RootLayout() {
	return (
		<TooltipProvider>
			<ProgressBar />
			<Outlet />
		</TooltipProvider>
	);
}
