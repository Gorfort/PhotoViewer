let rootHandle = null;
const pathStack = [];

export async function pickRootFolder() {
  rootHandle = await window.showDirectoryPicker();
  pathStack.length = 0;
  pathStack.push({ name: rootHandle.name, handle: rootHandle });
}

export function getCurrentFolderHandle() {
  return pathStack.length ? pathStack[pathStack.length - 1].handle : null;
}

export async function requestReadPermission(handle) {
  return await handle.requestPermission({ mode: 'read' }) === 'granted';
}

export async function deleteFile(path, fileName) {
  const baseDir = pathStack[0].handle;
  // Note: To delete, you may need to implement server-side logic or adapt for permissions
  // Here assuming you have an API endpoint
  const response = await fetch('/api/delete-file', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, fileName }),
  });
  return response.json();
}

// Expose path stack helpers (or move to uiFolders.js)
export { pathStack };
