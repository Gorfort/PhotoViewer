import { getPathStackNames } from './uiFolders.js';

const $ = id => document.getElementById(id);

const PHOTOS_PER_PAGE = 50;
let lightboxState = {
  images: [],
  currentIndex: 0,
};

export async function renderImages(images, currentPage) {
  lightboxState.images = images;
  const container = $('images');
  container.innerHTML = '';

  const start = (currentPage - 1) * PHOTOS_PER_PAGE;
  const pagedImages = images.slice(start, start + PHOTOS_PER_PAGE);

  for (const { name, entryHandle } of pagedImages) {
    await createImageThumb(name, entryHandle);
  }
}

async function createImageThumb(name, fileHandle) {
  const file = await fileHandle.getFile();
  const url = URL.createObjectURL(file);

  const container = document.createElement('div');
  container.className = 'image-container';

  const img = document.createElement('img');
  img.src = url;
  img.alt = name;
  img.onload = () => URL.revokeObjectURL(url);

  // Clicking the image opens lightbox
  img.onclick = () => openLightbox(name);

  container.appendChild(img);
  $('images').appendChild(container);
}

export function renderPagination(totalPages, currentPage, onPageChange) {
  const container = $('pagination');
  container.innerHTML = '';

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => onPageChange(i);
    container.appendChild(btn);
  }
}

function openLightbox(name) {
  const idx = lightboxState.images.findIndex(i => i.name === name);
  if (idx === -1) return;

  lightboxState.currentIndex = idx;
  updateLightbox();
  $('lightbox').style.display = 'flex';
}

function closeLightbox() {
  $('lightbox').style.display = 'none';
}

function updateLightbox() {
  const { currentIndex, images } = lightboxState;
  const imgElement = $('lightbox-img');

  if (!images[currentIndex]) return;

  images[currentIndex].entryHandle.getFile().then(file => {
    const url = URL.createObjectURL(file);
    imgElement.src = url;
    imgElement.alt = images[currentIndex].name;
    imgElement.onload = () => URL.revokeObjectURL(url);
  });
}

function prevImage() {
  if (lightboxState.currentIndex > 0) {
    lightboxState.currentIndex--;
    updateLightbox();
  }
}

function nextImage() {
  if (lightboxState.currentIndex < lightboxState.images.length - 1) {
    lightboxState.currentIndex++;
    updateLightbox();
  }
}

export function setupLightbox() {
  $('lightbox-close').onclick = closeLightbox;
  $('lightbox-prev').onclick = prevImage;
  $('lightbox-next').onclick = nextImage;
}
