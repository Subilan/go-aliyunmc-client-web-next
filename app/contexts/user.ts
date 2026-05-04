import { createContext } from 'react';
import type { User } from '~/types/User';

export const UserContext = createContext<User | null>(null);