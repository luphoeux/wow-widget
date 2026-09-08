import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getBlizzardAccessToken, getWowTokenPrice } from '@/lib/blizzard';

export async function GET(request: Request) {
  // Check for the CRON_SECRET to ensure only authorized callers can trigger this
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const accessToken = await getBlizzardAccessToken();
    
    // Fetch NA and EU prices
    const [priceUS, priceEU] = await Promise.all([
      getWowTokenPrice('us', accessToken).catch(e => {
        console.error('Failed to get US price', e);
        return null;
      }),
      getWowTokenPrice('eu', accessToken).catch(e => {
        console.error('Failed to get EU price', e);
        return null;
      })
    ]);

    const records = [];
    if (priceUS) records.push({ region: 'us', price: priceUS });
    if (priceEU) records.push({ region: 'eu', price: priceEU });

    if (records.length > 0) {
      const { error } = await supabase
        .from('wow_token_prices')
        .insert(records);

      if (error) {
        throw new Error(`Failed to insert into Supabase: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true, inserted: records.length });
  } catch (error: unknown) {
    console.error('Cron job error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
