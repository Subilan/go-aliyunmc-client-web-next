import { useEffect, useRef } from 'react';
import { SkinViewer } from 'skinview3d';
import useStateNamed from '~/hooks/useStateNamed';

const shimmerKeyframes = `
@keyframes shimmer-slide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

export function SkinModel(props: { uuid: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<SkinViewer | null>(null);
	const loading = useStateNamed(true);
	const scale = useStateNamed(1);

	useEffect(() => {
		if (!canvasRef.current) return;

		let cancelled = false;
		const skinUrl = `https://minotar.net/skin/${props.uuid}`;
		const img = new Image();

		img.onload = () => {
			if (cancelled || !canvasRef.current) return;
			loading.set(false);
			const viewer = new SkinViewer({
				canvas: canvasRef.current,
				width: 180,
				height: 320,
				skin: skinUrl
			});
			viewer.autoRotate = true;
			viewer.controls.enableZoom = false;
			viewerRef.current = viewer;
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

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const step = 0.1;
			const delta = e.deltaY > 0 ? -step : step;
			scale.set(current => Math.max(0.5, Math.min(2.5, current + delta)));
		};

		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, []);

	return (
		<div
			ref={containerRef}
			className="relative w-[180px] h-[320px]"
			style={{
				overflow: 'visible',
				transform: `scale(${scale.current})`,
				transformOrigin: 'center center',
				transition: 'transform 0.1s ease-out'
			}}
		>
			{loading.current && (
				<>
					<style>{shimmerKeyframes}</style>
					<div
						className="absolute inset-0 rounded-lg"
						style={{
							background:
								'linear-gradient(90deg, #e5e5e5 25%, #f5f5f5 50%, #e5e5e5 75%)',
							backgroundSize: '200% 100%',
							animation: 'shimmer-slide 1.6s ease-in-out infinite'
						}}
					/>
				</>
			)}
			<canvas ref={canvasRef} className="rounded-lg" />
		</div>
	);
}
