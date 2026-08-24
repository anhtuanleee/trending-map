import {
  BadgeAlert,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Map,
  Radio,
  ShieldCheck,
} from 'lucide-react';

import { getModerationQueue, type ModerationReport } from '@/lib/moderation';

const statusLabels: Record<ModerationReport['status'], string> = {
  unverified: 'Chưa xác minh',
  community_verified: 'Cộng đồng xác nhận',
  official_verified: 'Nguồn chính thức',
  disputed: 'Đang tranh luận',
};

export default async function DashboardPage() {
  const rows = await getModerationQueue();
  const urgent = rows.filter(
    (row) => row.severity === 'critical' || row.severity === 'high',
  ).length;
  const unverified = rows.filter((row) => row.status === 'unverified').length;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>Mạch Phố</span>
        </div>
        <nav>
          <a className="active" href="#queue">
            <ShieldCheck size={18} /> Kiểm duyệt
          </a>
          <a href="#map">
            <Map size={18} /> Bản đồ vận hành
          </a>
          <a href="#sources">
            <Radio size={18} /> Nguồn chính thức
          </a>
          <a href="#health">
            <CircleGauge size={18} /> Hệ thống
          </a>
        </nav>
        <div className="operator">
          <span className="avatar">AT</span>
          <span>
            <strong>Admin</strong>
            <small>Moderator</small>
          </span>
        </div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">TRUNG TÂM VẬN HÀNH</p>
            <h1>Hàng đợi kiểm duyệt</h1>
            <p className="lead">Ưu tiên báo cáo có ảnh hưởng cao, tranh luận hoặc nguy cơ trùng.</p>
          </div>
          <button className="primary">
            <CheckCircle2 size={17} /> Duyệt báo cáo tiếp theo
          </button>
        </header>

        <section className="stats" aria-label="Tóm tắt hàng đợi">
          <article>
            <span>Đang chờ</span>
            <strong>{rows.length}</strong>
            <small>Trong khu vực thí điểm</small>
          </article>
          <article>
            <span>Ưu tiên cao</span>
            <strong>{urgent}</strong>
            <small>Cần xem trong 15 phút</small>
          </article>
          <article>
            <span>Chưa xác minh</span>
            <strong>{unverified}</strong>
            <small>Thiếu bằng chứng độc lập</small>
          </article>
        </section>

        <section className="queue" id="queue">
          <div className="queue-head">
            <div>
              <h2>Báo cáo mới nhất</h2>
              <p>Demo data được dùng khi chưa cấu hình Supabase.</p>
            </div>
            <div className="filters">
              <button className="selected">Tất cả</button>
              <button>Ưu tiên</button>
              <button>Tranh luận</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Báo cáo</th>
                  <th>Khu vực</th>
                  <th>Độ tin cậy</th>
                  <th>Xác nhận</th>
                  <th>Trùng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="report-cell">
                        <span className={`severity ${row.severity}`}>
                          <BadgeAlert size={17} />
                        </span>
                        <span>
                          <strong>{row.title}</strong>
                          <small>
                            {row.category} · {row.age}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td>{row.district}</td>
                    <td>
                      <span className={`status ${row.status}`}>{statusLabels[row.status]}</span>
                    </td>
                    <td>{row.confirmations}</td>
                    <td>
                      <span className={`risk ${row.duplicateRisk}`}>{row.duplicateRisk}</span>
                    </td>
                    <td>
                      <button className="icon" aria-label={`Mở ${row.title}`}>
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
