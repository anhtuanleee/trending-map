# Subscription foundation

## Mục tiêu

Trending Map dùng subscription để bán tiện ích cá nhân hóa và tự động hóa, không bán quyền tiếp cận
thông tin an toàn công cộng. Public map, public report detail, tạo/xác nhận report và cảnh báo
critical từ nguồn chính thức không được đưa vào paywall.

MVP chỉ định nghĩa hai tier:

- `free`: tier mặc định của mọi user.
- `plus`: một entitlement trả phí, có product tháng và năm.

Không tạo nhiều paid tier trước khi có dữ liệu retention và conversion.

## Feature chi tiết

| Feature key      | Free                        | Plus                                  | Rollout mặc định    | Quy tắc                                                                   |
| ---------------- | --------------------------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `followed_areas` | 1 khu vực                   | 10 khu vực                            | Giai đoạn mở bán    | Chỉ lưu polygon/coarse area; không lưu GPS history                        |
| `custom_alerts`  | Cảnh báo safety cơ bản      | Filter category/severity/verification | Giai đoạn mở bán    | Critical official alert không bị chặn                                     |
| `alert_radius`   | Bán kính mặc định           | Tùy chỉnh bán kính                    | Giai đoạn mở bán    | Backend vẫn giới hạn bán kính an toàn                                     |
| `quiet_hours`    | Không tùy chỉnh             | Lịch theo ngày                        | Giai đoạn tiếp theo | Critical official có thể bypass quiet hours                               |
| `route_watch`    | Không có                    | Tối đa 3 tuyến                        | Sau MVP             | Chỉ lưu tuyến user chủ động tạo, không suy ra lịch sử di chuyển           |
| `report_history` | 7 ngày                      | 90 ngày                               | Giai đoạn tiếp theo | Đây là lịch sử report công khai theo khu vực, không phải location history |
| `saved_filters`  | Không có                    | Tối đa 10                             | Giai đoạn tiếp theo | Filter không thay đổi trust/verification                                  |
| `digests`        | Không có                    | Daily/weekly                          | Sau MVP             | Tổng hợp theo followed areas và notification preference                   |
| `ad_free`        | Có thể có placement sau này | Không quảng cáo                       | Sau MVP             | Sponsored event luôn gắn nhãn, kể cả Plus                                 |

Giá marketing fallback hiện được định nghĩa để dựng UI:

- Tháng: `29.000đ` — product `trending_map_plus_monthly`.
- Năm: `249.000đ` — product `trending_map_plus_yearly`.
- Founder năm: `199.000đ` — product `trending_map_plus_founder_yearly`.

Khi billing được nối, giá localized từ App Store/Google Play là nguồn sự thật; không tính tiền dựa
trên chuỗi fallback trong mobile bundle.

## Feature flags

Foundation mặc định tắt. Các lớp phải được bật theo thứ tự:

```dotenv
EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_PAYWALL_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_BILLING_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_FOUNDER_OFFER_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_ENABLED_FEATURES=
```

| Flag                                 | Tác dụng                                                         |
| ------------------------------------ | ---------------------------------------------------------------- |
| `SUBSCRIPTIONS_ENABLED`              | Bật route/account entry và query entitlement                     |
| `SUBSCRIPTION_PAYWALL_ENABLED`       | Cho phép UI chuyển từ preview sang paywall                       |
| `SUBSCRIPTION_BILLING_ENABLED`       | Cho phép purchase/restore nếu billing adapter cũng đã configured |
| `SUBSCRIPTION_FOUNDER_OFFER_ENABLED` | Chọn founder yearly product thay cho yearly chuẩn                |
| `SUBSCRIPTION_ENABLED_FEATURES`      | Danh sách feature key rollout, phân tách bằng dấu phẩy           |

Ví dụ chỉ preview followed areas và custom alert:

```dotenv
EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=true
EXPO_PUBLIC_SUBSCRIPTION_PAYWALL_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_BILLING_ENABLED=false
EXPO_PUBLIC_SUBSCRIPTION_ENABLED_FEATURES=followed_areas,custom_alerts
```

Unknown feature key bị bỏ qua. Client không coi việc bật env flag là bằng chứng user đã trả phí.

## Entitlement model

Shared contract có hai tier và các trạng thái:

```text
inactive → trialing → active → grace_period → past_due → expired/revoked
```

Chỉ `trialing`, `active` và `grace_period` mở Plus. Các trạng thái còn lại fallback về Free.

`subscription_entitlements` là server-owned mirror:

- Mobile authenticated user chỉ được đọc row của chính mình.
- Mobile không có quyền insert/update/delete.
- `original_transaction_id` ở database không đi vào public mobile contract.
- Billing webhook/service role sau này chịu trách nhiệm upsert trạng thái.
- Không có row đồng nghĩa với Free.

## Mobile structure

```text
features/subscriptions/
├── api/
│   ├── billing.gateway.ts
│   └── get-subscription-entitlement.ts
├── components/SubscriptionAccountEntry.tsx
├── domain/subscription-access.ts
├── hooks/useSubscription.ts
├── model/
│   ├── subscription-plans.ts
│   └── subscription-query-keys.ts
└── screens/SubscriptionScreen.tsx
```

`billing.gateway.ts` hiện là adapter không configured. Khi tích hợp RevenueCat, thay implementation
adapter; screen/hook/plan definition không cần phụ thuộc trực tiếp SDK native.

## Thứ tự hoàn thiện

1. Hoàn thành followed areas và push token registration.
2. Hoàn thành alert preferences/fan-out và privacy controls.
3. Tạo App Store/Google Play products.
4. Nối RevenueCat SDK vào billing gateway.
5. Tạo verified webhook Edge Function upsert entitlement.
6. Test purchase, cancel, refund, restore, billing retry và grace period.
7. Bật `SUBSCRIPTIONS_ENABLED` cho internal preview.
8. Bật feature rollout keys đã hoạt động.
9. Bật paywall; billing là flag cuối cùng.

Không bật billing nếu chưa có restore purchase, manage subscription, localized price, privacy/terms
links, analytics conversion và device test trên cả iOS/Android.
