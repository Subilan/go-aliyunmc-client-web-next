import { useEffect } from 'react';
import { useNavigation } from 'react-router';
import '../nprogress.css';
import NProgress from 'nprogress';

export default function ProgressBar() {
	const navigation = useNavigation();
	useEffect(() => {
		if (navigation.state === 'idle') {
			NProgress.done();
		} else {
			NProgress.start();
		}
	}, [navigation.state]);

	return null;
}
