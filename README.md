# 🎬 FrameFlow – Distributed Video Processing Platform (Phase 1)

**FrameFlow** is a scalable, modular, and developer-friendly video processing platform designed to handle video uploads, transcoding, job tracking, and delivery workflows.

This repository represents **Phase 1 (MVP)** – a basic video converter built using **Node.js**, **Go**, **React**, **FFmpeg**, and **SQLite**.

> 🚀 **Goal:** Upload a video → Convert it → Track status → Download result

---

## 🛠️ Tech Stack (Phase 1)

| Layer      | Technology Used                                    |
| ---------- | -------------------------------------------------- |
| Frontend   | React, Vite, Tailwind CSS (minimal styling)        |
| Backend    | Node.js (Express), Go (FFmpeg-based worker)        |
| Messaging  | Direct HTTP calls _(Redis-based queue in Phase 2)_ |
| Storage    | Local File System                                  |
| Database   | SQLite (for development)                           |
| Video Tool | FFmpeg                                             |

---

## 📦 Features – Phase 1 (MVP)

-   [ ] Upload a video from UI
-   [ ] Convert to multiple resolutions using FFmpeg
-   [ ] Track conversion job status
-   [ ] Download processed video
-   [ ] Basic job & file tracking with SQLite
-   [ ] Minimal UI and API setup for quick feedback

---

## 🚧 Status

> 🛠 **Work in Progress – Phase 1 MVP Under Active Development**

This is the foundational phase. Major improvements like Redis-based queues, WebSocket updates, and production-ready workflows are planned in upcoming phases.

---
