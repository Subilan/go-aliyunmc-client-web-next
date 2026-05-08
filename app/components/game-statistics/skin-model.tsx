import { useEffect, useRef } from 'react';
import { LinearProgress } from '@mui/material';
import { SkinViewer } from 'skinview3d';
import useStateNamed from '~/hooks/useStateNamed';

export function SkinModel(props: { uuid: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const viewerRef = useRef<SkinViewer | null>(null);
	const loading = useStateNamed(true);

	useEffect(() => {
		if (!canvasRef.current) return;

		let cancelled = false;
		const skinUrl = `https://minotar.net/skin/${props.uuid}`;
		const img = new Image();

		img.onload = () => {
			if (cancelled || !canvasRef.current) return;
			loading.set(false);
			viewerRef.current = new SkinViewer({
				canvas: canvasRef.current,
				width: 180,
				height: 200,
				skin: skinUrl
			});
			viewerRef.current.autoRotate = true;
		};

		img.onerror = () => {
			if (!cancelled) loading.set(false);
		};

		img.src = skinUrl;

		return () => {
			cancelled = true;
			viewerRef.current?.dispose();
		};
	}, [props.uuid]);

	return (
		<div className="relative w-[180px] h-[200px]">
			{loading.current && (
				<div className="absolute inset-0 flex items-center justify-center">
					<LinearProgress className="w-full" />
				</div>
			)}
			<canvas ref={canvasRef} className="rounded-lg" />
		</div>
	);
}
