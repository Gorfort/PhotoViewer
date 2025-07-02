import { pickRootFolder, getCurrentFolderHandle, requestReadPermission } from './fileSystem.js';
import {
  renderBreadcrumbs,
  setupBreadcrumbListeners,
  pushPath,
  popPath,
  clearPathStack,
  getPathStackNames,
  renderFolders  // <-- moved here
} from './uiFolders.js';
import { renderImages, renderPagination, setupLightbox } from './uiImages.js';

const $ = id => document.getElementById(id);

let currentPage = 1;

$('pickRoot').addEventListener('click', async () => {
  try {
    await pickRootFolder();
    currentPage = 1;
    await renderCurrent();
  } catch (err) {
    if (err.name !== 'AbortError') alert(`Error: ${err.message}`);
  }
});

async function renderCurrent() {
  const handle = getCurrentFolderHandle();
  if (!handle) return alert('No folder selected');

  const hasPermission = await requestReadPermission(handle);
  if (!hasPermission) {
    alert('Need read permission to show contents');
    return;
  }

  // Clear UI areas
  $('folders').innerHTML = '';
  $('images').innerHTML = '';
  $('pagination').innerHTML = '';

  renderBreadcrumbs();
  setupBreadcrumbListeners();

  // Read folder entries
  const entries = [];
  for await (const [name, entryHandle] of handle.entries()) {
    entries.push({ name, entryHandle });
  }

  // Separate folders and images
  const folders = entries.filter(e => e.entryHandle.kind === 'directory');
  const images = entries.filter(e =>
    e.entryHandle.kind === 'file' && /\.(jpe?g|png|gif|bmp|webp)$/i.test(e.name)
  );

  renderFolders(folders);
  await renderImages(images, currentPage);

  const totalPages = Math.ceil(images.length / 50);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  renderPagination(totalPages, currentPage, async (page) => {
    currentPage = page;
    await renderCurrent();
  });
}

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

// Initialize lightbox handlers
setupLightbox();

export { renderCurrent };
