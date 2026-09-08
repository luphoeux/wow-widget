import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { CircleDollarSign, Activity } from 'lucide-react';
import { getBlizzardAccessToken, getRealmsStatus } from '@/lib/blizzard';

export const revalidate = 0; // Disable cache for this page so it's always fresh

async function getLatestPrices() {
  try {
    const { data: usData, error: usError } = await supabase
      .from('wow_token_prices')
      .select('price')
      .eq('region', 'us')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: euData } = await supabase
      .from('wow_token_prices')
      .select('price')
      .eq('region', 'eu')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (usError?.code === '42P01') {
        throw new Error('Table does not exist. Please configure Supabase and run migrations.');
    }

    return {
      us: usData?.price || null,
      eu: euData?.price || null,
      error: null
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Supabase.';
    return {
      us: null,
      eu: null,
      error: errorMessage
    };
  }
}

function formatGold(copper: number | null) {
  if (copper === null) return '---';
  const gold = Math.floor(copper / 10000);
  return `${gold.toLocaleString()}`;
}

export default async function Home() {
  const { us, eu, error } = await getLatestPrices();

  let realmsUp = false;
  try {
    const token = await getBlizzardAccessToken();
    realmsUp = await getRealmsStatus(token);
  } catch (e) {
    console.error("Failed to check realm status", e);
  }

  // If both are null and there's no specific error, it means we have no data yet
  const needsSetup = error || (us === null && eu === null);

  return (
    <main className={styles.main}>
      <header className={styles.header + ' animate-fade-in'}>
        <h1 className={styles.title}>Azeroth Markets</h1>
        <p className={styles.subtitle}>Real-time commodities & token tracking</p>
      </header>

      <div className={styles.grid}>
        {needsSetup && (
          <div className={styles.setupWarning + ' animate-fade-in'}>
            <h3>⚠️ Configuration Required</h3>
            <p>{error ? error : "No data found. Ensure your Cron job has run at least once to populate the database."}</p>
          </div>
        )}

        <div className={styles.card + ' ' + styles.glass + ' animate-fade-in'}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <CircleDollarSign size={24} color="var(--accent-gold)" />
              WoW Token (NA)
            </h2>
            <div className={styles.statusBadge}>
              <div className={styles.statusDot}></div>
              Live
            </div>
          </div>
          
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Current Price</span>
            <div className={styles.priceValue}>
              {formatGold(us)} 
              {us !== null && <span className={styles.coinIcon + ' ' + styles.gold}></span>}
            </div>
          </div>
        </div>

        <div className={styles.card + ' ' + styles.glass + ' animate-fade-in'} style={{ animationDelay: '0.1s' }}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <CircleDollarSign size={24} color="var(--accent-silver)" />
              WoW Token (EU)
            </h2>
            <div className={styles.statusBadge}>
              <div className={styles.statusDot}></div>
              Live
            </div>
          </div>
          
          <div className={styles.priceContainer}>
            <span className={styles.priceLabel}>Current Price</span>
            <div className={styles.priceValue}>
              {formatGold(eu)}
              {eu !== null && <span className={styles.coinIcon + ' ' + styles.gold}></span>}
            </div>
          </div>
        </div>
        
        <div className={styles.card + ' ' + styles.glass + ' animate-fade-in'} style={{ animationDelay: '0.2s' }}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <Activity size={24} color={realmsUp ? "var(--success)" : "#ff7675"} />
              Commodities Server
            </h2>
            <div className={styles.statusBadge} style={{
              background: realmsUp ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
              color: realmsUp ? 'var(--success)' : '#ff7675'
            }}>
              <div className={styles.statusDot} style={{
                 background: realmsUp ? 'var(--success)' : '#ff7675',
                 boxShadow: realmsUp ? '0 0 10px var(--success)' : '0 0 10px #ff7675'
              }}></div>
              {realmsUp ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className={styles.priceContainer}>
             <span className={styles.priceLabel}>Status</span>
             <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                {realmsUp 
                  ? "All monitored realms (Illidan, Ragnaros, Drakkari) are operational. Ready for tracking." 
                  : "One or more monitored realms are currently offline or under maintenance."}
             </p>
          </div>
        </div>

      </div>
    </main>
  );
}
