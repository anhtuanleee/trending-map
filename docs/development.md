# Hướng dẫn phát triển

## Yêu cầu

- Node.js 22 trở lên.
- pnpm 11 (repo pin `pnpm@11.19.0`).
- Android Studio/Xcode khi chạy native mobile.
- Supabase CLI khi chạy backend local.
- Expo development build cho MapLibre.

## Cài đặt

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env.local
```

Mobile có thể chạy demo mode nếu không khai báo Supabase URL/key. Admin cũng dùng demo queue nếu thiếu server credentials.

## Environment

### Mobile

Xem `apps/mobile/.env.example`. Các biến client phải dùng prefix `EXPO_PUBLIC_`. Không đặt service-role key trong mobile app.
Email OTP không cần thêm biến client: Resend/SMTP API key được cấu hình trong Supabase Dashboard,
không đặt trong `.env` hoặc `EXPO_PUBLIC_*`. Xem hướng dẫn chi tiết tại
[`authentication-and-authorization.md`](./authentication-and-authorization.md#cấu-hình-email-otp).
Google OAuth cũng không thêm mobile env: Google Web Client ID/secret được cấu hình trong Supabase.
App dùng scheme `trendingmap` từ `app.json` và callback `trendingmap://auth/callback`.

### Admin

Xem `apps/admin/.env.example`:

- Supabase URL có thể dùng ở server/client theo nhu cầu.
- `SUPABASE_SERVICE_ROLE_KEY` là server-only secret, không dùng prefix `NEXT_PUBLIC_`.

## Chạy ứng dụng

```bash
pnpm dev:mobile
pnpm dev:admin
```

Các native command của mobile:

```bash
pnpm --filter @trending-map/mobile android
pnpm --filter @trending-map/mobile ios
```

Google OAuth cần development/production build để custom scheme quay lại app. Sau khi cài build,
kiểm tra callback trên thiết bị bằng:

```bash
npx uri-scheme open 'trendingmap://auth/callback' --android
npx uri-scheme open 'trendingmap://auth/callback' --ios
```

Location tracking cần test trên device/development build với các case: precise, approximate, denied,
blocked, Location Services tắt, không có last-known location và app quay lại sau khi mở Settings.
Tracking hiện chỉ chạy khi map screen còn mounted; không yêu cầu background permission.

Location picker của report cần test thêm: kéo pin, chọn GPS precise/approximate, từ chối quyền rồi
vẫn chọn pin thủ công, GPS accuracy trên 100 m bắt buộc chỉnh pin, reverse geocode thất bại và submit
khi chưa chọn vị trí. Pan/zoom map phải phát query mới sau debounce, giữ marker cũ trong lúc refetch
và trả empty state khi vùng không có dữ liệu.

## Supabase local

```bash
supabase start
supabase db reset
supabase functions serve submit-report
supabase functions serve confirm-report
```

`db reset` áp dụng migrations và seed lại dữ liệu local. Không chạy với target production nếu chưa kiểm tra project ref.

Muốn test Google với Supabase local, bật `[auth.external.google]` theo
[`authentication-and-authorization.md`](./authentication-and-authorization.md#cấu-hình-google-oauth)
và export `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` trong shell. Không commit secret vào repo.

## Quality gates

```bash
pnpm format:check
pnpm typecheck
pnpm test
pnpm build:admin
```

Khi đổi native dependency hoặc map code, chạy thêm development build/export Android/iOS phù hợp. Khi đổi schema/RLS, chạy Supabase tests và kiểm tra cả anonymous lẫn authenticated access.

## Branch và commit

Feature branch theo format `feat/(...)`, ví dụ:

```text
feat/(dynamic-map-viewport)
feat/(media-upload)
```

Mỗi PR nên nhỏ, có migration/contract/UI đồng bộ nếu thay đổi xuyên layer. Không commit `.env`, service-role key, access token hoặc generated native secrets.

## Definition of done

- Feature matrix phản ánh đúng mức độ hoàn thiện.
- Typecheck, tests và format pass.
- Public payload không lộ identity/internal trust.
- Mutation có loading/error/success và idempotency behavior.
- Auth gate chỉ cải thiện UX; backend vẫn enforce quyền.
- Query cache được invalidate đúng sau mutation.
- Migration có index/policy/grant cần thiết.
- Demo mode không che mất lỗi của production integration.

## Coding-agent assets

Root `AGENTS.md` và `apps/mobile/src/AGENTS.md` là instruction scope. Skills nằm trong `apps/mobile/src/skills`, role definitions nằm trong `apps/mobile/src/agents`. Các file này phục vụ development workflow và không phải runtime modules.
