import { Outlet, redirect } from 'react-router';
import { useEffect, useState } from 'react';
import { Auth } from '~/utils/auth';
import { UserContext } from '~/contexts/user';
import { PermissionsContext } from '~/contexts/permissions';
import { McTranslationContext } from '~/contexts/mctranslations';
import { getPermissions } from '~/utils/requests/permissions';
import { getMcTranslations } from '~/utils/requests/mc-translation';
import { createLoader } from '~/utils/createLoader';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import AppSidebar from '~/components/app-sidebar';
import type { UserPermissions } from '~/types/UserPermissions';
import type { McTranslation } from '~/types/McTranslations';

export const appLoader = createLoader(async () => {
	const user = await Auth.getUser();
	if (!user) {
		throw redirect('/lor');
	}
	return { user };
});

export default function AppLayout() {
	const { user } = appLoader.get();
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	const [mctranslations, setMcTranslations] = useState<McTranslation | null>(null);

	useEffect(() => {
		Promise.all([
			getPermissions().then(setPermissions),
			getMcTranslations().then(setMcTranslations)
		]);
	}, []);

	return (
		<UserContext.Provider value={user}>
			<PermissionsContext.Provider value={permissions}>
				<McTranslationContext.Provider value={mctranslations}>
					<SidebarProvider>
						<AppSidebar />
						<SidebarInset>
							<div className="flex flex-1 flex-col gap-5 p-5 pt-10 md:pt-10">
								<Outlet />
							</div>
						</SidebarInset>
					</SidebarProvider>
				</McTranslationContext.Provider>
			</PermissionsContext.Provider>
		</UserContext.Provider>
	);
}
