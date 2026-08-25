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

Feature rollout lấy từ Supabase khi app đã cấu hình backend. Chỉ trong demo mode, có thể preview UI
đang rollout mà không bật production flag:

```dotenv
EXPO_PUBLIC_DEMO_FEATURE_PREVIEW_KEYS=live_incident_timeline,photo_evidence_upload
```

Subscription foundation mặc định tắt. Có thể tạo `apps/mobile/.env.local` và bật preview mà chưa
bật paywall/billing:

```dotenv
EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=true
EXPO_PUBLIC_SUBSCRIPTION_PAYWALL_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_BILLING_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_ENABLED_FEATURES=followed_areas,custom_alerts
```

Các biến `EXPO_PUBLIC_*` nằm trong mobile bundle, vì vậy không đặt RevenueCat secret, webhook secret,
App Store key hoặc service-role key ở đây. Xem [`subscriptions.md`](./subscriptions.md).

### Admin

Xem `apps/admin/.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`: Project Settings → API → Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings → API → publishable/anon key.
- Không đặt `SUPABASE_SERVICE_ROLE_KEY` trong admin env hoặc browser bundle. Edge Functions nhận
  secret này từ Supabase runtime để ký private preview và publish ảnh.

Tạo user moderator qua Auth rồi gán role bằng SQL operator (thay UUID thật):

```sql
update public.user_roles set role = 'moderator' where user_id = '<auth-user-uuid>';
```

Nếu thiếu hai biến public, admin chạy demo mode và không ghi Supabase.

## Chạy ứng dụng

Do MapLibre chứa native code, không chạy mobile app bằng Expo Go. Lần đầu hoặc sau khi đổi native
dependency, build và cài development client local:

```bash
pnpm mobile:android
# hoặc trên macOS
pnpm mobile:ios
```

Sau khi development client đã được cài trên simulator/device, chạy Metro hằng ngày bằng:

```bash
pnpm dev:mobile
pnpm dev:mobile:clear # dùng khi vừa đổi Babel/Metro/NativeWind config
```

Web và admin có command riêng:

```bash
pnpm dev:mobile:web
pnpm dev:admin
```

Không dùng `pnpm dev:mobile` rồi quét QR bằng Expo Go: Expo Go không chứa native MapLibre module.
`expo-dev-client` tạo development build có custom scheme và native dependencies đúng với app.

Production bundle smoke test không cần emulator/device:

```bash
pnpm build:mobile:android
pnpm build:mobile:web
```

## NativeWind

Mobile dùng NativeWind v4 với Tailwind CSS v3. CSS entry được import một lần tại
`apps/mobile/app/_layout.tsx`; Metro xử lý `apps/mobile/global.css` qua
`apps/mobile/metro.config.js`. Tailwind scan cả `app` và `src` theo cấu hình trong
`apps/mobile/tailwind.config.js`.

Static layout/spacing/typography mới có thể dùng `className`. Các giá trị phụ thuộc runtime như
MapLibre paint expression, animation style, tọa độ hoặc màu theo dữ liệu vẫn dùng object/StyleSheet.
Không migrate toàn bộ UI trong một lần; khi chỉnh một component thì chuyển phần static của component
đó và giữ `src/theme`/`ui-tokens` làm nguồn semantic design value.

Sau khi sửa Babel, Metro, Tailwind hoặc global CSS, xóa cache Metro rồi chạy lại:

```bash
pnpm dev:mobile:clear
```

Kiểm tra riêng pipeline Tailwind:

```bash
pnpm --filter @trending-map/mobile exec tailwindcss \
  -i ./global.css \
  -o /tmp/trending-map-nativewind.css \
  --minify
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

Recent areas cần test: chỉ pan/zoom do user mới tạo record, camera follow GPS không ghi record, center
được làm tròn 0,01°, zoom 0,5, danh sách không vượt quá 8 và pin đưa khu vực lên đầu. Dữ liệu hiện chỉ
ở local SecureStore; chưa sync vào `followed_areas`.

Photo evidence cần rebuild development client sau khi cài `expo-image-picker` và
`expo-image-manipulator`. Test các case: denied/blocked rồi mở Settings, chọn 1–3 ảnh, ảnh nguồn trên
20 MB, output trên 5 MB, remove preview, mất mạng giữa bộ ảnh, retry sau khi object đã upload nhưng
completion thất bại và xác nhận media chưa duyệt không xuất hiện trong public detail.

## Supabase local

```bash
supabase start
supabase db reset
supabase functions serve submit-report
supabase functions serve confirm-report
supabase functions serve create-report-media-upload
supabase functions serve complete-report-media-upload
supabase functions serve get-report-media-moderation-queue
supabase functions serve moderate-report-media
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
