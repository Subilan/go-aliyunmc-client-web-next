import { del, get, patch, post } from '~/utils/requests';

export interface ChangelogItem {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  body: string;
  category: 'platform' | 'server';
  like_count: number;
  liked: boolean;
}

export interface ChangelogQueryResult {
  items: ChangelogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function getChangelogs(params?: {
  sortBy?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  category?: 'platform' | 'server';
}) {
  return get<ChangelogQueryResult>('/changelogs', {
    sortBy: params?.sortBy ?? 'desc',
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    category: params?.category,
  });
}

export function createChangelog(body: {
  title: string;
  body: string;
  category: 'platform' | 'server';
}) {
  return post<ChangelogItem>('/changelog', body);
}

export function updateChangelog(
  id: number,
  body: { title?: string; body?: string; category?: 'platform' | 'server' },
) {
  return patch(`/changelog/${id}`, body);
}

export function deleteChangelog(id: number) {
  return del(`/changelog/${id}`);
}

export function toggleLike(id: number) {
  return post<{ liked: boolean; like_count: number }>(`/changelog/${id}/like`, {});
}

export function categoryText(category: ChangelogItem['category']) {
  switch (category) {
    case 'platform':
      return '平台更新';
    case 'server':
      return '服务器更新';
    default:
      return '';
  }
}