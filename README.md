# 📁 Image Folder Viewer

A lightweight web-based application to browse and preview images from a local folder using the File System Access API.

## 🔍 Features

- Pick a local root folder and browse its subdirectories
- Pagination support for large image sets
- Breadcrumb navigation for folder hierarchy
- Displays number of image items (automatically hidden if empty)

## 🚀 Getting Started

Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
cd project
node server.js
```

Then open your browser and go to:

```
http://localhost:3000
```

(or whatever port your server uses)

> ⚠️ The File System Access API requires a secure context. Running the project via `localhost` is supported.

## 🖼 Supported Formats

- `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.cr3`, `.raw`

## 🛠 Browser Support

- ✅ Chrome
- ✅ Edge
- ⚠️ Firefox/Safari – File System Access API not supported

