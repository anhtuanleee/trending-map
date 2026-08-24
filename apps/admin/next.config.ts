import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@trending-map/contracts', '@trending-map/ui-tokens'],
};

export default nextConfig;
