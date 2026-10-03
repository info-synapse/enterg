import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/api';
import type { Competition, Sport } from '@/api/types';
import { AppFrame, LeftNav } from '@/components/Layout';

let cache: Promise<[Sport[], Competition[]]> | null = null;
export function useSportsNav() {
  const [data, setData] = useState<[Sport[], Competition[]]>([[], []]);
  useEffect(() => {
    cache ??= Promise.all([api.sportsbook.getSports(), api.sportsbook.getCompetitions()]);
    cache.then(setData);
  }, []);
  return { sports: data[0], competitions: data[1] };
}

export function SportsFrame({ children }: { children: ReactNode }) {
  const { sports, competitions } = useSportsNav();
  return <AppFrame left={<LeftNav sports={sports} competitions={competitions} />}>{children}</AppFrame>;
}
