import { httpApi } from '@/api/http';
import { useAsync } from '@/lib/useAsync';
import { AccountFrame } from './AccountFrame';
import { MethodList, PayWidget } from './Payments';

export function Deposit2() {
  const { data, error, reload } = useAsync(() => httpApi.payments.getDepositMethods(), []);
  return <AccountFrame>
    <h1 className="page-title">Deposit2</h1>
    <p className="hint">Pick how you want to pay. Deposits count towards your deposit limit.</p>
    <PayWidget />
    {error ? <p role="alert">{error} <button className="btn btn-ghost" onClick={reload}>Retry</button></p>
      : data ? <MethodList methods={data} base="/account/deposit2" disabled />
      : <div className="skeleton" style={{ height: 300 }} />}
  </AccountFrame>;
}
