/* uiImages.js ------------------------------------------------------------ */

const $ = id => document.getElementById(id);

const PHOTOS_PER_PAGE = 50;

/* Global state for lightbox */
export const lightboxState = {
  images: [],        // [{ name, file }]
  currentIndex: 0,
};

/* ----------  renderImages  -------------------------------------------- */
export async function renderImages(entries, currentPage) {
  const start = (currentPage - 1) * PHOTOS_PER_PAGE;
  const pageEntries = entries.slice(start, start + PHOTOS_PER_PAGE);

  /* Load File objects so we can read metadata later */
  const pageFiles = await Promise.all(
    pageEntries.map(async ({ name, entryHandle }) => {
      const file = await entryHandle.getFile();
      return { name, file };
    })
  );

  lightboxState.images = pageFiles;        // save for lightbox

  /* Build thumbnails */
  const container = $('images');
  container.innerHTML = '';

  for (const { name, file } of pageFiles) {
    createImageThumb(name, file);
  }
}

/* ----------  createImageThumb  ---------------------------------------- */
function createImageThumb(name, file) {
  const thumbUrl = URL.createObjectURL(file);

  const wrap   = document.createElement('div');
  wrap.className = 'image-container';

  const img = document.createElement('img');
  img.src   = thumbUrl;
  img.alt   = name;
  img.onload = () => URL.revokeObjectURL(thumbUrl);
  img.style.cursor = 'pointer';

  /* open lightbox on click */
  img.onclick = () => {
    const idx = lightboxState.images.findIndex(i => i.name === name);
    if (idx !== -1) openLightbox(idx);
  };

  wrap.appendChild(img);
  $('images').appendChild(wrap);
}

/* ----------  pagination buttons  -------------------------------------- */
export function renderPagination(totalPages, currentPage, onPageChange) {
  const nav = $('pagination');
  nav.innerHTML = '';
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => onPageChange(i);
    nav.appendChild(btn);
  }
}

/* ----------  Lightbox helpers  ---------------------------------------- */
const lightbox     = $('lightbox');
const imgBig       = $('lightbox-img');
const metaBox      = $('lightbox-meta');
const btnClose     = $('lightbox-close');
const btnPrev      = $('lightbox-prev');
const btnNext      = $('lightbox-next');

function openLightbox(idx) {
  lightboxState.currentIndex = idx;
  updateLightbox();
  lightbox.style.display = 'flex';
}

function closeLightbox() {
  lightbox.style.display = 'none';
  imgBig.src = '';
  metaBox.textContent = '';
}

function updateLightbox() {
  const { images, currentIndex } = lightboxState;
  const info = images[currentIndex];
  if (!info) return;

  const file = info.file;
  const url  = URL.createObjectURL(file);

  imgBig.src = url;
  imgBig.alt = file.name;

  imgBig.onload = () => {
    // Basic info
    let metaText = '';

    // Read EXIF
    EXIF.getData(file, function() {
      // Removed the "make" tag as you requested
      const model = EXIF.getTag(this, "Model") || "Unknown Model";
      const fstop = EXIF.getTag(this, "FNumber");
      const exposure = EXIF.getTag(this, "ExposureTime");
      const iso = EXIF.getTag(this, "ISOSpeedRatings");
      const focalLength = EXIF.getTag(this, "FocalLength");

      // Format values nicely
      const fstopStr = fstop ? `f/${fstop}` : "N/A";
      const exposureStr = exposure ? `${exposure}s` : "N/A";
      const isoStr = iso || "N/A";
      const focalLengthStr = focalLength ? `${focalLength}mm` : "N/A";

      metaText += `Camera Model: ${model}`;
      metaText += `\nF-stop: ${fstopStr}`;
      metaText += `\nExposure: ${exposureStr}`;
      metaText += `\nISO: ${isoStr}`;
      metaText += `\nFocal Length: ${focalLengthStr}`;

      metaBox.textContent = metaText;
      URL.revokeObjectURL(url);
    });
  };
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

/* Call once from main.js */
export function setupLightbox() {
  btnClose.onclick = closeLightbox;
  btnPrev.onclick  = prevImage;
  btnNext.onclick  = nextImage;

  /* close when background clicked */
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  /* arrow / Esc keys */
  document.addEventListener('keydown', e => {
    if (lightbox.style.display !== 'flex') return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft')  prevImage();
    else if (e.key === 'ArrowRight') nextImage();
  });
}
