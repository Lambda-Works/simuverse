'use client'
import AdminPanel from '@/views/AdminPanel';

import { use } from 'react';

export default function AdminTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = use(params);
  return <AdminPanel tabId={resolvedParams.tab} />;
}
