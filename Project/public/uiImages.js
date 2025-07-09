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

  const wrap = document.createElement('div');
  wrap.className = 'image-container';

  const img = document.createElement('img');
  img.src = thumbUrl;
  img.alt = name;
  img.dataset.name = name;                // handy if you need lookup later
  img.style.cursor = 'pointer';

  img.onload = () => URL.revokeObjectURL(thumbUrl);

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
const lightbox    = $('lightbox');
const imgBig      = $('lightbox-img');
const metaBox     = $('lightbox-meta');
const btnClose    = $('lightbox-close');
const btnPrev     = $('lightbox-prev');
const btnNext     = $('lightbox-next');

/* NEW: create a single Download <a> element (styled by .lightbox-action) */
const btnDownload = document.createElement('a');
btnDownload.id = 'lightbox-download';
btnDownload.className = 'lightbox-action';
btnDownload.textContent = 'Download';

function openLightbox(idx) {
  lightboxState.currentIndex = idx;
  updateLightbox();
  lightbox.style.display = 'flex';
}

function closeLightbox() {
  /* revoke last object URL to free memory */
  if (imgBig.dataset.url) {
    URL.revokeObjectURL(imgBig.dataset.url);
    delete imgBig.dataset.url;
  }
  lightbox.style.display = 'none';
  imgBig.src = '';
  metaBox.textContent = '';
}

function updateLightbox() {
  const { images, currentIndex } = lightboxState;
  const info = images[currentIndex];
  if (!info) return;

  /* revoke any previous URL */
  if (imgBig.dataset.url) {
    URL.revokeObjectURL(imgBig.dataset.url);
  }

  const file = info.file;
  const url  = URL.createObjectURL(file);
  imgBig.dataset.url = url;

  imgBig.src = url;
  imgBig.alt = file.name;

  /* ----- DOWNLOAD BUTTON ----- */
  btnDownload.href     = url;
  btnDownload.download = file.name;
  if (!metaBox.nextSibling || metaBox.nextSibling.id !== 'lightbox-download') {
    metaBox.insertAdjacentElement('afterend', btnDownload);
  }
  /* --------------------------- */

  imgBig.onload = () => {
    let metaText = '';

    EXIF.getData(file, function() {
      const model       = EXIF.getTag(this, 'Model') || 'Unknown Model';
      const fstop       = EXIF.getTag(this, 'FNumber');
      const exposure    = EXIF.getTag(this, 'ExposureTime');
      const iso         = EXIF.getTag(this, 'ISOSpeedRatings');
      const focalLength = EXIF.getTag(this, 'FocalLength');

      metaText += `Camera Model: ${model}`;
      metaText += `\nF-stop: ${fstop ? 'f/' + fstop : 'N/A'}`;
      metaText += `\nExposure: ${exposure ? exposure + 's' : 'N/A'}`;
      metaText += `\nISO: ${iso || 'N/A'}`;
      metaText += `\nFocal Length: ${focalLength ? focalLength + 'mm' : 'N/A'}`;

      metaBox.textContent = metaText;
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
    if (e.key === 'Escape')        closeLightbox();
    else if (e.key === 'ArrowLeft')  prevImage();
    else if (e.key === 'ArrowRight') nextImage();
  });
}
