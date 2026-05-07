import { createContext } from 'react';
import type { McTranslation } from '~/types/McTranslations';

export const McTranslationContext = createContext<McTranslation | null>(null);