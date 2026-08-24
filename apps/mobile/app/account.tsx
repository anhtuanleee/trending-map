import { AccountScreen } from '@/features/auth';
import { SubscriptionAccountEntry } from '@/features/subscriptions';

export default function AccountRoute() {
  return <AccountScreen subscriptionEntry={<SubscriptionAccountEntry />} />;
}
