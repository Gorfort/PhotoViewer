import { navigateIntoFolder, navigateBreadcrumb } from './main.js';

const $ = id => document.getElementById(id);

import { pathStack } from './fileSystem.js';

export function renderBreadcrumbs() {
  const breadcrumbs = pathStack
    .map((p, i) => `<a href="#" data-idx="${i}">${p.name}</a>`)
    .join(' / ');
  $('breadcrumbs').innerHTML = breadcrumbs;
}

export function setupBreadcrumbListeners() {
  $('breadcrumbs').querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const idx = Number(a.dataset.idx);
      await navigateBreadcrumb(idx);
    })
  );
}

export function renderFolders(folders) {
  const container = $('folders');
  folders.forEach(({ name, entryHandle }) => {
    const box = document.createElement('div');
    box.className = 'folder';
    box.innerHTML = `<div>📁</div><span>${name}</span>`;
    box.onclick = () => navigateIntoFolder(name, entryHandle);
    container.appendChild(box);
  });
}

export function pushPath(name, handle) {
  pathStack.push({ name, handle });
}

export function popPath(idx) {
  pathStack.splice(idx + 1);
}

export function clearPathStack() {
  pathStack.length = 0;
}

export function getPathStackNames() {
  return pathStack.map(p => p.name.trim());
}
