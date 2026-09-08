import { supabase } from '@/lib/supabase';
import { CircleDollarSign } from 'lucide-react';

export const revalidate = 0;

function formatGold(copper: number | null) {
  if (copper === null) return '---';
  const gold = Math.floor(copper / 10000);
  return `${gold.toLocaleString()}`;
}

export default async function EmbedRegion({ params }: { params: { region: string } }) {
  const region = params.region.toLowerCase();
  
  const { data } = await supabase
    .from('wow_token_prices')
    .select('price, created_at')
    .eq('region', region === 'eu' ? 'eu' : 'us')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const price = data ? formatGold(data.price) : '---';
  const updated = data ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div style={{
      width: '100%', height: '100vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)',
      color: 'white', fontFamily: 'system-ui, sans-serif', padding: '1rem',
      boxSizing: 'border-box', overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
        <CircleDollarSign size={20} color={region === 'eu' ? "#bdc3c7" : "#f1c40f"} />
        WoW Token ({region.toUpperCase()})
      </div>
      <div style={{ fontSize: '3rem', fontWeight: 800, color: region === 'eu' ? '#bdc3c7' : '#f1c40f', textShadow: `0 0 20px ${region === 'eu' ? 'rgba(189, 195, 199, 0.4)' : 'rgba(241, 196, 15, 0.4)'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {price}
      </div>
      <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '8px' }}>
        Actualizado: {updated}
      </div>
    </div>
  );
}
