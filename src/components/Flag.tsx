// Country flags as inline SVG (country-flag-icons, MIT licence), so they work offline and in the preview.
// England and Scotland are not in the set, so they are drawn here. Areas (UEFA, World) get an emblem instead.
import {
  AR, AT, AU, BE, BR, CH, CN, CY, DE, DK, ES, EU, FR, GR, HR, IT, JP, KR, MX, NL, PL, PT, RS, SA, TR, US,
} from 'country-flag-icons/react/3x2';
import type { ComponentType } from 'react';
import { Icon } from './Icon';

// Only the props used below, so library and hand-drawn flags share one type.
type FlagProps = { title?: string; width?: number; height?: number; preserveAspectRatio?: string };
type FlagSvg = ComponentType<FlagProps>;

const England: FlagSvg = ({ title: _t, ...p }) => (
  <svg viewBox="0 0 30 20" {...p}><rect width="30" height="20" fill="#fff" /><rect x="12.5" width="5" height="20" fill="#ce1124" /><rect y="7.5" width="30" height="5" fill="#ce1124" /></svg>
);
const Scotland: FlagSvg = ({ title: _t, ...p }) => (
  <svg viewBox="0 0 30 20" {...p}><rect width="30" height="20" fill="#005eb8" /><path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="3.2" /></svg>
);

const FLAGS: Record<string, FlagSvg> = {
  Greece: GR, England, Scotland, Spain: ES, Italy: IT, Germany: DE, France: FR, Portugal: PT, Cyprus: CY, Netherlands: NL,
  Turkey: TR, Austria: AT, Belgium: BE, Croatia: HR, Denmark: DK, Poland: PL, Serbia: RS, Switzerland: CH, Argentina: AR,
  Brazil: BR, Mexico: MX, USA: US, Australia: AU, Japan: JP, 'Saudi Arabia': SA, 'South Korea': KR, China: CN,
  UEFA: EU, Europe: EU,
};

export function Flag({ region, size = 20 }: { region: string; size?: number }) {
  const F = FLAGS[region];
  const h = Math.round((size * 2) / 3);
  if (!F)
    return (
      <span className="flag area" style={{ width: size, height: h }} title={region} aria-hidden="true">
        <Icon name="globe" size={h} strokeWidth={2} />
      </span>
    );
  return (
    <span className="flag" style={{ width: size, height: h }} aria-hidden="true">
      <F title={region} preserveAspectRatio="xMidYMid slice" width={size} height={h} />
    </span>
  );
}

/** "Greece · Super League" -> "Greece" (event lists carry the region in the competition name). */
export const regionOf = (competitionName: string) => competitionName.split(' · ')[0];
