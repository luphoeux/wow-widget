import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint is unauthenticated and meant to be consumed by Scriptable/KWGT widgets.
// If you want to secure it, you can add a simple API key check here.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'us'; // Default to US

    // Get the most recent price from Supabase
    const { data, error } = await supabase
      .from('wow_token_prices')
      .select('price, created_at')
      .eq('region', region)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
         return NextResponse.json({ price: 0, formatted: '0g', message: 'No data found' });
      }
      throw error;
    }

    // price is in copper. 10000 copper = 1 gold
    const gold = Math.floor(data.price / 10000);
    const formatted = `${gold.toLocaleString()}g`;

    return NextResponse.json({
      price: data.price,
      gold,
      formatted,
      updated_at: data.created_at,
      region
    });
    
  } catch (error: unknown) {
    console.error('Widget data error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
