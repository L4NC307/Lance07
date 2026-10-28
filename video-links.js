export function parseVideoLink(value) {
  const text = String(value || '').trim();
  if (!text) throw new Error('Paste a video link first.');
  let url;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error('Enter a complete YouTube or direct video link.');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Use an http or https video link without sign-in details.');
  }
  const host = url.hostname.toLowerCase();
  const youtubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
  const shortHosts = ['youtu.be', 'www.youtu.be'];
  const embedHosts = ['youtube-nocookie.com', 'www.youtube-nocookie.com'];
  const parts = url.pathname.split('/').filter(Boolean);
  let id;
  if (shortHosts.includes(host)) {
    id = parts.length === 1 ? parts[0] : null;
  } else if (youtubeHosts.includes(host)) {
    id = url.pathname === '/watch' ? url.searchParams.get('v')
      : ['shorts', 'embed', 'live'].includes(parts[0]) && parts.length === 2 ? parts[1] : null;
  } else if (embedHosts.includes(host)) {
    id = parts[0] === 'embed' && parts.length === 2 ? parts[1] : null;
  }
  if ([...youtubeHosts, ...shortHosts, ...embedHosts].includes(host)) {
    if (!/^[\w-]{11}$/.test(id || '')) {
      throw new Error('Paste a link to an individual YouTube video, rather than a channel or playlist.');
    }
    const rawStart = url.searchParams.get('start') || url.searchParams.get('t') || '';
    let start = 0;
    if (/^\d+$/.test(rawStart)) start = Number(rawStart);
    else {
      const time = rawStart.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
      if (time) start = Number(time[1] || 0) * 3600 + Number(time[2] || 0) * 60 + Number(time[3] || 0);
    }
    start = Number.isSafeInteger(start) ? Math.min(start, 604800) : 0;
    return { type: 'youtube', id, start, url: `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}` };
  }
  if (/\.(mp4|webm|ogg|ogv)$/i.test(url.pathname)) {
    return { type: 'file', url: url.href };
  }
  throw new Error('Use a YouTube link or a direct video link ending in .mp4, .webm, .ogg or .ogv.');
}
