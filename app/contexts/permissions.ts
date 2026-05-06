import { createContext } from 'react';
import type { UserPermissions } from '~/types/UserPermissions';

export const PermissionsContext = createContext<UserPermissions | null>(null);
