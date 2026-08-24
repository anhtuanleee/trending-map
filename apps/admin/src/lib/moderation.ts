import { createClient } from '@supabase/supabase-js';

export type ModerationReport = {
  id: string;
  category: string;
  title: string;
  district: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  status: 'unverified' | 'community_verified' | 'official_verified' | 'disputed';
  confirmations: number;
  age: string;
  duplicateRisk: 'low' | 'medium' | 'high';
};

const demoRows: ModerationReport[] = [
  {
    id: '2e130699-a737-4942-bf43-f9f217bdf84b',
    category: 'Ngập nước',
    title: 'Ngập sâu trên đường Nguyễn Huệ',
    district: 'Quận 1',
    severity: 'high',
    status: 'community_verified',
    confirmations: 14,
    age: '8 phút',
    duplicateRisk: 'medium',
  },
  {
    id: '42a37a67-b480-4809-8658-97cfcbd34c63',
    category: 'Ổ gà',
    title: 'Ổ gà lớn sát giao lộ',
    district: 'Quận 1',
    severity: 'medium',
    status: 'unverified',
    confirmations: 1,
    age: '30 phút',
    duplicateRisk: 'low',
  },
  {
    id: '966922b1-d61e-43a3-a26a-c21c802dbe11',
    category: 'Cây đổ',
    title: 'Cây lớn chắn một phần đường',
    district: 'Quận 3',
    severity: 'critical',
    status: 'disputed',
    confirmations: 5,
    age: '42 phút',
    duplicateRisk: 'high',
  },
];

export async function getModerationQueue(): Promise<ModerationReport[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return demoRows;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('public_report_details')
    .select(
      'id,category_name,title,address_label,severity,verification_status,confirmation_count,created_at',
    )
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category_name,
    title: row.title,
    district: row.address_label ?? 'Chưa rõ khu vực',
    severity: row.severity,
    status: row.verification_status,
    confirmations: row.confirmation_count,
    age: new Intl.RelativeTimeFormat('vi', { numeric: 'auto' }).format(
      -Math.max(1, Math.round((Date.now() - new Date(row.created_at).getTime()) / 60_000)),
      'minute',
    ),
    duplicateRisk: 'low',
  }));
}
