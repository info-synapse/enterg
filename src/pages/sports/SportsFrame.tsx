import { type ReactNode } from 'react';
import { mockApi } from '@/api/mock';
import { useAsync } from '@/lib/useAsync';
import { loadBackendCatalog } from '@/lib/backendSports';
import { AppFrame, LeftNav } from '@/components/Layout';

export function useSportsNav(backend = false) {
  const result = useAsync(async () => {
    if (backend) return loadBackendCatalog();
    const [sports, competitions] = await Promise.all([mockApi.sportsbook.getSports(), mockApi.sportsbook.getCompetitions()]);
    return { sports, competitions };
  }, [backend]);
  return { sports: result.data?.sports ?? [], competitions: result.data?.competitions ?? [], loading: result.loading, error: result.error, reload: result.reload };
}

export function SportsFrame({ children }: { children: ReactNode }) {
  const { sports, competitions } = useSportsNav();
  return <AppFrame left={<LeftNav sports={sports} competitions={competitions} />}>{children}</AppFrame>;
}
