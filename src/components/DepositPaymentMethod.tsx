import dotpay from '@/assets/payments/dotpay.svg';
import skrill from '@/assets/payments/skrill.svg';
import paysafe from '@/assets/payments/paysafe.svg';
import blik from '@/assets/payments/blik.svg';
import viva from '@/assets/payments/viva.png';

export function DepositPaymentMethod({ method }: { method: string }) {
  const text = method.toLowerCase();
  const provider = text.includes('dotpay') ? { name: 'Dotpay', logo: dotpay }
    : text.includes('skrill') ? { name: 'Skrill', logo: skrill }
    : text.includes('paysafe') ? { name: 'Paysafe', logo: paysafe }
    : text.includes('blik') ? { name: 'BLIK', logo: blik }
    : text.includes('viva') ? { name: 'Viva payments', logo: viva } : null;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    {provider && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 36, flexShrink: 0, background: provider.name === 'Viva payments' ? '#163447' : '#fff', borderRadius: 5, padding: 4 }}>
      <img src={provider.logo} alt={provider.name} title={provider.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </span>}
    <span style={{ overflowWrap: 'anywhere' }}>{method || '—'}</span>
  </span>;
}
