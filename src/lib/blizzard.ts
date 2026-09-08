export async function getBlizzardAccessToken(): Promise<string> {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Blizzard credentials are not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to get Blizzard access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getWowTokenPrice(region: 'us' | 'eu', accessToken: string): Promise<number> {
  const namespace = `dynamic-${region}`;
  const locale = region === 'us' ? 'en_US' : 'en_GB';
  
  const response = await fetch(`https://${region}.api.blizzard.com/data/wow/token/index?namespace=${namespace}&locale=${locale}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    // We don't want Next.js to heavily cache this if we call it in a cron
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WoW token price for ${region}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.price; // price is in copper
}

export async function getRealmsStatus(accessToken: string): Promise<boolean> {
  // Connected Realm IDs: Illidan (57), Ragnaros (1427), Drakkari (1425)
  const realmIds = [57, 1427, 1425];
  
  try {
    const results = await Promise.all(realmIds.map(async (id) => {
      const res = await fetch(`https://us.api.blizzard.com/data/wow/connected-realm/${id}?namespace=dynamic-us&locale=en_US`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        // Cache this for 60 seconds so we don't spam Blizzard API on every page refresh
        next: { revalidate: 60 } 
      });
      
      if (!res.ok) return false;
      const data = await res.json();
      return data.status?.type === 'UP';
    }));

    // Returns true only if ALL specified realms are UP
    return results.every(isUp => isUp === true);
  } catch (error) {
    console.error("Error fetching realm status:", error);
    return false;
  }
}
