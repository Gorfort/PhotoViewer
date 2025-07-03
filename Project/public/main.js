/* main.js --------------------------------------------------------------- */
import {
  pickRootFolder,
  getCurrentFolderHandle,
  requestReadPermission
} from './fileSystem.js';

import {
  renderBreadcrumbs,
  setupBreadcrumbListeners,
  pushPath,
  popPath,
  renderFolders
} from './uiFolders.js';

import {
  renderImages,
  renderPagination,
  setupLightbox
} from './uiImages.js';

const $ = id => document.getElementById(id);

let currentPage = 1;

const breadcrumbsNav = $('breadcrumbs');   // <nav>
const imagesTitle    = $('images-title');  // <h2 id="images-title">

/* Add this in your HTML or dynamically in JS */
// <h2 id="images-title">Images <span id="image-count"></span></h2>

/* ────────────────────────────────────────────────────────────
   Initialise lightbox handlers (buttons, keys, etc.)
   uiImages.setupLightbox wires its own listeners.           */
setupLightbox();

/* ────────────────────────────────────────────────────────────
   Pick‑Root button                                            */
$('pickRoot').addEventListener('click', async () => {
  try {
    await pickRootFolder();
    currentPage = 1;

    /* reveal hidden elements */
    breadcrumbsNav.style.display = 'block';
    imagesTitle.style.display    = 'flex'; 
    

    await renderCurrent();
  } catch (err) {
    /* ignore “Cancel” clicks, show others */
    if (err.name !== 'AbortError') alert(`Error: ${err.message}`);
  }
});

/* ────────────────────────────────────────────────────────────
   Render current folder                                       */
   async function renderCurrent() {
  const handle = getCurrentFolderHandle();
  if (!handle) {
    alert('No folder selected');
    return;
  }

  // Clear the title container to prepare for fresh content
  imagesTitle.innerHTML = '';

  // Create a span for folder name
  const titleSpan = document.createElement('span');
  titleSpan.textContent = handle.name || 'Images';
  titleSpan.className = 'title-text';

  // Create a span for item count
  const countSpan = document.createElement('span');
  countSpan.id = 'image-count';
  // REMOVE this line:
  // countSpan.style.marginLeft = 'auto';

  // Append both spans inside imagesTitle
  imagesTitle.appendChild(titleSpan);
  imagesTitle.appendChild(countSpan);

  /* ask for permission once per folder */
  if (await requestReadPermission(handle) !== true) {
    alert('Need read permission to show contents');
    return;
  }

  /* clear previous UI */
  $('folders').innerHTML    = '';
  $('images').innerHTML     = '';
  $('pagination').innerHTML = '';

  /* breadcrumbs */
  renderBreadcrumbs();
  setupBreadcrumbListeners();

  /* read directory entries */
  const dirEntries = [];
  for await (const [name, entryHandle] of handle.entries()) {
    dirEntries.push({ name, entryHandle });
  }

  const folders = dirEntries.filter(e => e.entryHandle.kind === 'directory');
  const images  = dirEntries.filter(e =>
    e.entryHandle.kind === 'file' &&
    /\.(jpe?g|png|gif|bmp|webp|CR3|RAW)$/i.test(e.name)
  );

  renderFolders(folders);
  await renderImages(images, currentPage);

  /* Update the count span text */
  countSpan.textContent = `items : ${images.length}`;

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(images.length / 50));
  if (currentPage > totalPages) currentPage = totalPages;

  renderPagination(totalPages, currentPage, async page => {
    currentPage = page;
    await renderCurrent();
  });
}

/* ────────────────────────────────────────────────────────────
   Public helpers used by uiFolders.js                         */
export async function navigateIntoFolder(name, handle) {
  pushPath(name, handle);
  currentPage = 1;
  await renderCurrent();
}

export async function navigateBreadcrumb(idx) {
  popPath(idx);
  currentPage = 1;
  await renderCurrent();
}
