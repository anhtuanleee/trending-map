'use client';

import type { ReportMediaModerationItem, ReportModerationItem } from '@trending-map/contracts';
import type { Session } from '@supabase/supabase-js';
import {
  CheckCircle2,
  BadgeCheck,
  Ban,
  CircleGauge,
  CircleCheckBig,
  ImageIcon,
  LoaderCircle,
  LogOut,
  Map,
  Radio,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  demoMediaQueue,
  demoReportQueue,
  getMediaModerationQueue,
  getReportModerationQueue,
  moderateMedia,
  moderateReport,
} from '@/lib/moderation';
import { getSupabaseBrowserClient, hasSupabaseConfig } from '@/lib/supabase-browser';

type AuthStep = 'email' | 'code';
type QueueMode = 'reports' | 'media';

function formatAge(value: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  return minutes < 60 ? `${minutes} phút trước` : `${Math.round(minutes / 60)} giờ trước`;
}

function formatBytes(value: number) {
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('moderator_required') || message.includes('403')) {
    return 'Tài khoản này chưa có role moderator.';
  }
  return 'Không thể hoàn tất thao tác. Hãy thử lại.';
}

const flagReasonLabels = {
  false_information: 'Thông tin sai',
  incorrect_location: 'Sai vị trí',
  outdated: 'Đã hết hiệu lực',
  privacy_violation: 'Riêng tư',
  defamation: 'Vu khống',
  fake_official_source: 'Giả mạo nguồn',
  dangerous_content: 'Nguy hiểm',
  spam: 'Spam',
  copyright: 'Bản quyền',
  other: 'Khác',
} as const;

export function AdminDashboard() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [queueMode, setQueueMode] = useState<QueueMode>('reports');
  const [rows, setRows] = useState<ReportMediaModerationItem[]>(configured ? [] : demoMediaQueue);
  const [reportRows, setReportRows] = useState<ReportModerationItem[]>(
    configured ? [] : demoReportQueue,
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(configured);
  const [notice, setNotice] = useState<string | null>(
    configured ? null : 'Đang chạy demo mode — chưa gửi command tới Supabase.',
  );
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    if (!configured || !supabase) {
      setRows(demoMediaQueue);
      setReportRows(demoReportQueue);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [media, reports] = await Promise.allSettled([
        getMediaModerationQueue(supabase),
        getReportModerationQueue(supabase),
      ]);
      if (media.status === 'fulfilled') setRows(media.value);
      if (reports.status === 'fulfilled') setReportRows(reports.value);
      const failed = [media, reports].find((result) => result.status === 'rejected');
      if (failed?.status === 'rejected') setError(readableError(failed.reason));
    } catch (loadError) {
      setError(readableError(loadError));
    } finally {
      setLoading(false);
    }
  }, [configured, supabase]);

  useEffect(() => {
    if (!configured || !supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
      if (data.session) void loadQueue();
      else setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setTimeout(() => void loadQueue(), 0);
      else {
        setRows([]);
        setReportRows([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [configured, loadQueue, supabase]);

  async function requestCode() {
    if (!supabase || !email.trim()) return;
    setBusyId('auth');
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setBusyId(null);
    if (authError) setError('Không gửi được mã đăng nhập. Kiểm tra email moderator.');
    else {
      setAuthStep('code');
      setNotice('Mã đăng nhập đã được gửi qua email.');
    }
  }

  async function verifyCode() {
    if (!supabase || !email.trim() || code.trim().length < 6) return;
    setBusyId('auth');
    setError(null);
    const { error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusyId(null);
    if (authError) setError('Mã đăng nhập không đúng hoặc đã hết hạn.');
  }

  async function decide(row: ReportMediaModerationItem, decision: 'approve' | 'reject') {
    const reason = reasons[row.mediaId]?.trim();
    if (decision === 'reject' && !reason) {
      setError('Nhập lý do từ chối trước khi gửi.');
      return;
    }
    setBusyId(row.mediaId);
    setError(null);
    setNotice(null);
    try {
      if (configured && supabase) {
        await moderateMedia(supabase, {
          mediaId: row.mediaId,
          decision,
          reason,
          idempotencyKey: crypto.randomUUID(),
        });
      }
      setRows((current) => current.filter((item) => item.mediaId !== row.mediaId));
      setNotice(decision === 'approve' ? 'Ảnh đã được duyệt và xuất bản.' : 'Ảnh đã bị từ chối.');
    } catch (moderationError) {
      setError(readableError(moderationError));
    } finally {
      setBusyId(null);
    }
  }

  async function decideReport(row: ReportModerationItem, action: 'approve' | 'resolve' | 'reject') {
    const reason = reasons[row.caseId]?.trim();
    if (action !== 'approve' && !reason) {
      setError('Nhập lý do trước khi resolve hoặc reject báo cáo.');
      return;
    }
    setBusyId(row.caseId);
    setError(null);
    setNotice(null);
    try {
      if (configured && supabase) {
        await moderateReport(supabase, {
          caseId: row.caseId,
          action,
          reason,
          idempotencyKey: crypto.randomUUID(),
        });
      }
      setReportRows((current) => current.filter((item) => item.caseId !== row.caseId));
      setNotice(
        action === 'approve'
          ? 'Báo cáo đã được điều phối viên xác minh.'
          : action === 'resolve'
            ? 'Báo cáo đã chuyển sang resolved.'
            : 'Báo cáo đã bị reject và ẩn khỏi public view.',
      );
    } catch (moderationError) {
      setError(readableError(moderationError));
    } finally {
      setBusyId(null);
    }
  }

  if (!authReady) {
    return (
      <div className="center-state">
        <LoaderCircle className="spin" /> Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (configured && !session) {
    return (
      <main className="login-page">
        <section className="login-card">
          <span className="login-mark">
            <ShieldCheck />
          </span>
          <p className="eyebrow">TRENDING MAP OPERATIONS</p>
          <h1>Moderator sign in</h1>
          <p className="lead">
            Dùng email đã được gán role moderator. Mã OTP không tạo tài khoản mới.
          </p>
          <label>
            Email moderator
            <input
              autoComplete="email"
              disabled={authStep === 'code'}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="moderator@example.com"
              type="email"
              value={email}
            />
          </label>
          {authStep === 'code' && (
            <label>
              Mã đăng nhập
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={8}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                value={code}
              />
            </label>
          )}
          {error && <p className="message error">{error}</p>}
          {notice && <p className="message success">{notice}</p>}
          <button
            className="primary wide"
            disabled={busyId === 'auth'}
            onClick={() => void (authStep === 'email' ? requestCode() : verifyCode())}
          >
            {busyId === 'auth' && <LoaderCircle className="spin" size={17} />}
            {authStep === 'email' ? 'Gửi mã đăng nhập' : 'Xác nhận mã'}
          </button>
          {authStep === 'code' && (
            <button className="text-button" onClick={() => setAuthStep('email')}>
              Đổi email
            </button>
          )}
        </section>
      </main>
    );
  }

  const activeRows = queueMode === 'reports' ? reportRows : rows;
  const urgent = activeRows.filter((row) => ['critical', 'high'].includes(row.severity)).length;
  const totalSize = rows.reduce((sum, row) => sum + row.fileSizeBytes, 0);
  const disputed = reportRows.filter((row) => row.verificationStatus === 'disputed').length;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>Trending Map</span>
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
          <span className="avatar">{session?.user.email?.slice(0, 2).toUpperCase() ?? 'DM'}</span>
          <span>
            <strong>{session?.user.email ?? 'Demo moderator'}</strong>
            <small>Moderator</small>
          </span>
          {session && (
            <button
              className="logout"
              aria-label="Đăng xuất"
              onClick={() => void supabase?.auth.signOut()}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">TRUNG TÂM VẬN HÀNH</p>
            <h1>{queueMode === 'reports' ? 'Kiểm duyệt báo cáo' : 'Kiểm duyệt ảnh hiện trường'}</h1>
            <p className="lead">
              {queueMode === 'reports'
                ? 'Xác minh, kết thúc hoặc loại báo cáo bằng transition được kiểm soát ở database.'
                : 'Chỉ ảnh được duyệt mới được copy sang public bucket và xuất hiện trên app.'}
            </p>
          </div>
          <button className="secondary" disabled={loading} onClick={() => void loadQueue()}>
            <RefreshCw className={loading ? 'spin' : ''} size={17} /> Làm mới
          </button>
        </header>

        <div className="queue-tabs" role="tablist" aria-label="Loại hàng đợi">
          <button
            className={queueMode === 'reports' ? 'selected' : ''}
            onClick={() => setQueueMode('reports')}
            role="tab"
          >
            Báo cáo <span>{reportRows.length}</span>
          </button>
          <button
            className={queueMode === 'media' ? 'selected' : ''}
            onClick={() => setQueueMode('media')}
            role="tab"
          >
            Ảnh hiện trường <span>{rows.length}</span>
          </button>
        </div>

        <section className="stats" aria-label="Tóm tắt hàng đợi">
          <article>
            <span>Đang chờ</span>
            <strong>{activeRows.length}</strong>
            <small>{queueMode === 'reports' ? 'Moderation case mở' : 'Ảnh JPEG private'}</small>
          </article>
          <article>
            <span>Ưu tiên cao</span>
            <strong>{urgent}</strong>
            <small>Critical và high severity</small>
          </article>
          <article>
            <span>{queueMode === 'reports' ? 'Đang tranh luận' : 'Dung lượng'}</span>
            <strong>{queueMode === 'reports' ? disputed : formatBytes(totalSize)}</strong>
            <small>
              {queueMode === 'reports'
                ? 'Cộng đồng có tín hiệu trái chiều'
                : 'Tổng dữ liệu cần xem'}
            </small>
          </article>
        </section>

        {error && <p className="message error banner">{error}</p>}
        {notice && <p className="message success banner">{notice}</p>}

        <section className="queue" id="queue">
          {queueMode === 'media' ? (
            <>
              <div className="queue-head">
                <div>
                  <h2>Ảnh mới nhất</h2>
                  <p>Signed preview hết hạn sau 10 phút; refresh để tạo URL mới.</p>
                </div>
                {!configured && <span className="demo-badge">DEMO MODE</span>}
              </div>

              {loading ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" /> Đang tải hàng đợi…
                </div>
              ) : rows.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 /> Không còn ảnh chờ duyệt.
                </div>
              ) : (
                <div className="media-grid">
                  {rows.map((row) => (
                    <article className="media-card" key={row.mediaId}>
                      <div className="preview-wrap">
                        {/* Signed URLs are generated only after the moderator role check. */}
                        <img alt={`Bằng chứng cho ${row.reportTitle}`} src={row.previewUrl} />
                        <span className={`severity-pill ${row.severity}`}>{row.severity}</span>
                      </div>
                      <div className="media-content">
                        <div className="media-meta">
                          <span>
                            <ImageIcon size={14} /> {row.categoryName}
                          </span>
                          <span>{formatAge(row.uploadedAt)}</span>
                        </div>
                        <h3>{row.reportTitle}</h3>
                        <p>{row.addressLabel ?? 'Chưa có tên khu vực'}</p>
                        <dl>
                          <div>
                            <dt>Kích thước</dt>
                            <dd>
                              {row.width} × {row.height}
                            </dd>
                          </div>
                          <div>
                            <dt>Dung lượng</dt>
                            <dd>{formatBytes(row.fileSizeBytes)}</dd>
                          </div>
                        </dl>
                        <label className="reason-field">
                          Lý do nếu từ chối
                          <textarea
                            maxLength={500}
                            onChange={(event) =>
                              setReasons((current) => ({
                                ...current,
                                [row.mediaId]: event.target.value,
                              }))
                            }
                            placeholder="Ảnh mờ, không liên quan, chứa dữ liệu nhạy cảm…"
                            value={reasons[row.mediaId] ?? ''}
                          />
                        </label>
                        <div className="actions">
                          <button
                            className="reject"
                            disabled={busyId === row.mediaId}
                            onClick={() => void decide(row, 'reject')}
                          >
                            <XCircle size={17} /> Từ chối
                          </button>
                          <button
                            className="approve"
                            disabled={busyId === row.mediaId}
                            onClick={() => void decide(row, 'approve')}
                          >
                            {busyId === row.mediaId ? (
                              <LoaderCircle className="spin" size={17} />
                            ) : (
                              <CheckCircle2 size={17} />
                            )}{' '}
                            Duyệt ảnh
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="queue-head">
                <div>
                  <h2>Báo cáo cần quyết định</h2>
                  <p>Ưu tiên severity cao và report đang disputed; reason chỉ lưu nội bộ.</p>
                </div>
                {!configured && <span className="demo-badge">DEMO MODE</span>}
              </div>

              {loading ? (
                <div className="empty-state">
                  <LoaderCircle className="spin" /> Đang tải hàng đợi…
                </div>
              ) : reportRows.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 /> Không còn báo cáo chờ duyệt.
                </div>
              ) : (
                <div className="report-grid">
                  {reportRows.map((row) => (
                    <article className="report-card" key={row.caseId}>
                      <div className="report-card-head">
                        <div>
                          <span className="report-category">{row.categoryName}</span>
                          <h3>{row.title}</h3>
                        </div>
                        <span className={`severity-pill static ${row.severity}`}>
                          {row.severity}
                        </span>
                      </div>
                      <p className="report-description">{row.description}</p>
                      <p className="report-location">
                        {row.addressLabel ?? 'Chưa có tên khu vực'} · {formatAge(row.createdAt)}
                      </p>
                      <div className="report-signals">
                        <span className={`verification ${row.verificationStatus}`}>
                          {row.verificationStatus === 'disputed'
                            ? 'Đang tranh luận'
                            : row.verificationStatus === 'community_verified'
                              ? 'Cộng đồng xác nhận'
                              : 'Chưa xác minh'}
                        </span>
                        <span>{row.confirmationCount} xác nhận</span>
                        <span>{row.notThereCount} phản đối</span>
                        <span>Priority {row.priority}</span>
                        <span>{row.moderationStatus}</span>
                        <span>{row.visibilityStatus}</span>
                      </div>
                      {row.openFlagCount > 0 ? (
                        <div className="report-signals">
                          <span>{row.openFlagCount} báo cáo vi phạm</span>
                          {row.flagReasons.map((reason) => (
                            <span key={reason}>{flagReasonLabels[reason]}</span>
                          ))}
                        </div>
                      ) : null}
                      <label className="reason-field">
                        Ghi chú nội bộ
                        <textarea
                          maxLength={500}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [row.caseId]: event.target.value,
                            }))
                          }
                          placeholder="Bắt buộc khi resolve/reject; không hiển thị công khai."
                          value={reasons[row.caseId] ?? ''}
                        />
                      </label>
                      <div className="report-actions">
                        <button
                          className="approve"
                          disabled={busyId === row.caseId}
                          onClick={() => void decideReport(row, 'approve')}
                        >
                          <BadgeCheck size={17} /> Xác minh
                        </button>
                        <button
                          className="resolve"
                          disabled={busyId === row.caseId}
                          onClick={() => void decideReport(row, 'resolve')}
                        >
                          <CircleCheckBig size={17} /> Kết thúc
                        </button>
                        <button
                          className="reject"
                          disabled={busyId === row.caseId}
                          onClick={() => void decideReport(row, 'reject')}
                        >
                          <Ban size={17} /> Loại bỏ
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
