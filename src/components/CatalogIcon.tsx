import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Flag } from './Flag';
export function CatalogIcon({ url, region, icon = 'sports', size = 18, imageWidth = size, imageHeight = size }: { url?: string; region?: string; icon?: string; size?: number; imageWidth?: number; imageHeight?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  let safe = false;
  try { safe = !!url && ['http:', 'https:'].includes(new URL(url).protocol); } catch {}
  return safe && !failed ? <img src={url} alt="" width={imageWidth} height={imageHeight} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} style={{ ...(imageWidth !== size || imageHeight !== size ? { width: imageWidth, height: imageHeight } : {}), objectFit: 'contain', flexShrink: 0 }} /> : region ? <Flag region={region} size={size} /> : <Icon name={icon} size={size} />;
}
