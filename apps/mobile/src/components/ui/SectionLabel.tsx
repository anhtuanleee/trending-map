import { Text } from 'react-native';

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mt-5 mb-2 text-primary text-[11px] font-extrabold tracking-[0.8px] uppercase">
      {children}
    </Text>
  );
}
