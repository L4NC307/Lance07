import { parseVideoLink } from './video-links.js';

const storageKey = 'hubert-portfolio-videos-v1';
const cards = [...document.querySelectorAll('[data-video-slot]')];
const editor = document.getElementById('video-editor');
const viewer = document.getElementById('video-viewer');
const form = document.getElementById('video-link-form');
const urlInput = document.getElementById('video-url');
const titleInput = document.getElementById('video-name');
const error = document.getElementById('video-link-error');
const remove = document.getElementById('video-remove');
const player = document.getElementById('video-player');
const original = document.getElementById('video-original');
const note = document.getElementById('video-save-note');
let editingSlot = 0;
let videos = cards.map(() => null);

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) {
    videos = cards.map((_, index) => {
      try {
        const entry = saved[index];
        return entry ? { ...parseVideoLink(entry.url), title: String(entry.title || '').slice(0, 80) } : null;
      } catch { return null; }
    });
  }
} catch {
  note.textContent = 'Add your links, then click a video to expand. Browser storage is unavailable; links will last for this visit.';
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(videos));
    note.textContent = 'Saved in this browser. Click a video to expand, or Edit link to change it.';
  } catch {
    note.textContent = 'Saved for this visit only. This browser could not save your links for next time.';
  }
}

function renderCard(index) {
  const card = cards[index];
  const video = videos[index];
  const thumbnail = card.querySelector('.video-thumbnail');
  const title = video?.title || `Video ${String(index + 1).padStart(2, '0')}`;
  thumbnail.querySelector('img')?.remove();
  thumbnail.classList.toggle('has-video', Boolean(video));
  thumbnail.setAttribute('aria-label', video ? `Expand ${title}` : `Add video ${index + 1}`);
  thumbnail.querySelector('.video-play').textContent = video ? '\u25b6' : '+';
  thumbnail.querySelector('.video-empty-label').textContent = video ? 'Expand video' : 'Add video';
  card.querySelector('.video-title').textContent = title;
  card.querySelector('.video-edit').textContent = video ? 'Edit link' : 'Add link';
  if (video?.type === 'youtube') {
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => image.remove(), { once: true });
    thumbnail.prepend(image);
  }
}

function editVideo(index) {
  editingSlot = index;
  const video = videos[index];
  document.getElementById('video-editor-title').textContent = `${video ? 'Edit' : 'Add'} video ${index + 1}`;
  urlInput.value = video?.url || '';
  titleInput.value = video?.title || '';
  error.textContent = '';
  urlInput.removeAttribute('aria-invalid');
  remove.hidden = !video;
  editor.showModal();
  urlInput.focus();
}

function expandVideo(index) {
  const video = videos[index];
  if (!video) return editVideo(index);
  const title = video.title || `Video ${String(index + 1).padStart(2, '0')}`;
  document.getElementById('video-viewer-title').textContent = title;
  document.getElementById('video-player-note').textContent = 'If the video cannot play here, open the original link.';
  original.href = video.url;
  original.textContent = video.type === 'youtube' ? 'Open on YouTube \u2197' : 'Open original video \u2197';
  player.replaceChildren();
  if (video.type === 'youtube') {
    const frame = document.createElement('iframe');
    const source = new URL(`https://www.youtube-nocookie.com/embed/${video.id}`);
    source.searchParams.set('autoplay', '1');
    source.searchParams.set('playsinline', '1');
    source.searchParams.set('rel', '0');
    if (video.start) source.searchParams.set('start', video.start);
    frame.src = source.href;
    frame.title = title;
    frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.append(frame);
  } else {
    const element = document.createElement('video');
    element.src = video.url;
    element.controls = true;
    element.autoplay = true;
    element.playsInline = true;
    element.setAttribute('aria-label', title);
    element.addEventListener('error', () => {
      document.getElementById('video-player-note').textContent = 'This video could not load. Check the link or open the original video.';
    });
    player.append(element);
  }
  viewer.showModal();
}

cards.forEach((card, index) => {
  renderCard(index);
  card.querySelector('.video-thumbnail').addEventListener('click', () => expandVideo(index));
  card.querySelector('.video-edit').addEventListener('click', () => editVideo(index));
});

form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const parsed = parseVideoLink(urlInput.value);
    videos[editingSlot] = { ...parsed, title: titleInput.value.trim().slice(0, 80) };
    persist();
    renderCard(editingSlot);
    editor.close();
  } catch (reason) {
    error.textContent = reason.message;
    urlInput.setAttribute('aria-invalid', 'true');
    urlInput.focus();
  }
});
urlInput.addEventListener('input', () => {
  error.textContent = '';
  urlInput.removeAttribute('aria-invalid');
});
remove.addEventListener('click', () => {
  videos[editingSlot] = null;
  persist();
  renderCard(editingSlot);
  editor.close();
});

for (const dialog of [editor, viewer]) {
  dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
}
viewer.addEventListener('close', () => {
  const video = player.querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  player.replaceChildren();
  original.removeAttribute('href');
});
