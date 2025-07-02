import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Helper to resolve safe paths inside ./public
function resolvePublicPath(parts) {
  const baseDir = path.resolve(__dirname, 'public');
  const fullPath = path.resolve(baseDir, ...parts);

  if (!fullPath.startsWith(baseDir)) {
    throw new Error('Invalid path: Outside of public directory');
  }
  return fullPath;
}

// List folder contents API
app.get('/api/list', async (req, res) => {
  const folderPath = req.query.path ? req.query.path.split('/') : [];
  try {
    const dirFullPath = resolvePublicPath(folderPath);
    const files = await fs.readdir(dirFullPath, { withFileTypes: true });
    const result = files.map(f => ({
      name: f.name,
      type: f.isDirectory() ? 'folder' : 'file',
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pagination-enabled photo listing API
app.get('/api/photos', async (req, res) => {
  const folderPath = req.query.path ? req.query.path.split('/') : [];
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  try {
    const dirFullPath = resolvePublicPath(folderPath);
    const files = await fs.readdir(dirFullPath, { withFileTypes: true });

    const images = files
      .filter(f => f.isFile() && /\.(jpe?g|png|gif|bmp|webp)$/i.test(f.name))
      .map(f => f.name);

    const totalPhotos = images.length;
    const totalPages = Math.ceil(totalPhotos / limit);

    const start = (page - 1) * limit;
    const pagedPhotos = images.slice(start, start + limit);

    res.json({
      photos: pagedPhotos,
      page,
      totalPages,
      totalPhotos,
      folderPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/delete-file', async (req, res) => {
  try {
    const baseDir = path.resolve(__dirname, 'public');
    const folderPath = req.body.path;
    let fileName = req.body.fileName;

    if (!Array.isArray(folderPath) || !fileName) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    fileName = decodeURIComponent(fileName.trim());

    const fullPath = path.resolve(baseDir, ...folderPath.map(p => p.trim()), fileName);
    console.log('Deleting file at:', fullPath);

    await fs.unlink(fullPath);

    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
