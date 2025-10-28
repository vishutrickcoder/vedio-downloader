// import express, { json } from "express";
// import { spawn, execSync } from "child_process";
// import { v4 as uuidv4 } from "uuid";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";
// import {
//   existsSync,
//   mkdirSync,
//   createWriteStream,
//   readdirSync,
// } from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();
// app.use(json());
// app.use(express.static(join(__dirname, "public"))); // for static assets
// app.set("view engine", "ejs");
// app.set("views", join(__dirname, "views"));

// const DOWNLOAD_DIR = join(__dirname, "downloads");
// if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR);

// const downloads = {}; // jobId -> { status, filename, progress, thumbnail }

// // ---------------- FRONTEND ----------------
// app.get("/", (req, res) => res.render("index"));

// // ---------------- START DOWNLOAD ----------------
// app.post("/download", async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: "url required" });
//   if (!/^https?:\/\//.test(url))
//     return res.status(400).json({ error: "invalid url" });

//   const id = uuidv4();
//   const tempOut = join(DOWNLOAD_DIR, `${id}.%(ext)s`);
//   const finalOut = join(DOWNLOAD_DIR, `${id}_final.mp4`);
//   const thumbPath = join(DOWNLOAD_DIR, `${id}.jpg`);

//   downloads[id] = { status: "processing", progress: 0, thumbnail: null };

//   console.log(`⬇️ Starting download for ${url}`);

//   // 1️⃣ Download best video + thumbnail
//   const args = [
//     "--format",
//     "bestvideo+bestaudio/best",
//     "--merge-output-format",
//     "mkv",
//     "--write-thumbnail",
//     "--convert-thumbnails",
//     "jpg",
//     "--output",
//     tempOut,
//     "--no-playlist",
//     url,
//   ];

//   const logPath = join(DOWNLOAD_DIR, `${id}.log`);
//   const logStream = createWriteStream(logPath, { flags: "a" });
//   const ytdlp = spawn("yt-dlp", args);

//   ytdlp.stdout.on("data", (data) => {
//     const msg = data.toString();
//     logStream.write(msg);

//     const match = msg.match(/(\d+\.\d)%/);
//     if (match) {
//       downloads[id].progress = parseFloat(match[1]);
//     }
//   });

//   ytdlp.stderr.pipe(logStream);

//   ytdlp.on("close", (code) => {
//     console.log(`✅ yt-dlp finished with code ${code}`);

//     const file = readdirSync(DOWNLOAD_DIR).find(
//       (f) =>
//         f.startsWith(id) &&
//         (f.endsWith(".mkv") || f.endsWith(".webm") || f.endsWith(".mp4"))
//     );
//     const thumb = readdirSync(DOWNLOAD_DIR).find(
//       (f) => f.startsWith(id) && f.endsWith(".jpg")
//     );

//     if (thumb) downloads[id].thumbnail = `/thumbnail/${thumb}`;

//     if (!file) {
//       downloads[id].status = "failed";
//       return;
//     }

//     const inputPath = join(DOWNLOAD_DIR, file);

//     console.log("🎞 Re-encoding to MP4 (H.264 + AAC)...");
//     try {
//       execSync(
//         `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${finalOut}"`,
//         { stdio: "ignore" }
//       );
//       downloads[id].status = "ready";
//       downloads[id].filename = `${id}_final.mp4`;
//       downloads[id].progress = 100;
//       console.log(`✅ Final video ready: ${finalOut}`);
//     } catch (err) {
//       console.error("❌ Re-encode failed:", err);
//       downloads[id].status = "failed";
//     }
//   });

//   res.json({ jobId: id });
// });

// // ---------------- STATUS ----------------
// app.get("/status/:id", (req, res) => {
//   const id = req.params.id;
//   const data = downloads[id];
//   if (!data) return res.status(404).json({ error: "unknown id" });

//   res.json({
//     status: data.status,
//     progress: data.progress,
//     thumbnail: data.thumbnail,
//     downloadUrl:
//       data.status === "ready" ? `/file/${id}` : undefined,
//   });
// });

// // ---------------- FILE DOWNLOAD ----------------
// app.get("/file/:id", (req, res) => {
//   const id = req.params.id;
//   const data = downloads[id];
//   if (!data || data.status !== "ready")
//     return res.status(404).send("Not ready yet");

//   const filePath = join(DOWNLOAD_DIR, data.filename);
//   res.download(filePath, `${id}.mp4`);
// });

// // ---------------- THUMBNAIL ----------------
// app.get("/thumbnail/:file", (req, res) => {
//   const file = req.params.file;
//   const path = join(DOWNLOAD_DIR, file);
//   res.sendFile(path);
// });

// // ---------------- SERVER ----------------
// app.listen(3000, () =>
//   console.log("🚀 HD Downloader running at http://localhost:3000")
// );



// // ===================== Working ============================


// import express, { json } from "express";
// import { spawn, execSync } from "child_process";
// import { v4 as uuidv4 } from "uuid";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";
// import {
//   existsSync,
//   mkdirSync,
//   createWriteStream,
//   readdirSync,
// } from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();
// app.use(json());

// const DOWNLOAD_DIR = join(__dirname, "downloads");
// if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR);

// const downloads = {}; // jobId -> filename/status

// // ------------------- POST /download -------------------
// app.post("/download", async (req, res) => {
//   const { url, quality } = req.body;
//   if (!url) return res.status(400).json({ error: "url required" });
//   if (!/^https?:\/\//.test(url))
//     return res.status(400).json({ error: "invalid url" });

//   const id = uuidv4();
//   const tempOut = join(DOWNLOAD_DIR, `${id}.%(ext)s`);
//   const finalOut = join(DOWNLOAD_DIR, `${id}_final.mp4`);
//   downloads[id] = "processing";

//   console.log(`⬇️ Starting full-quality download for ${url}`);

//   // Step 1: Download best available
//   const args = [
//     "--format",
//     "bestvideo+bestaudio/best",
//     "--merge-output-format",
//     "mkv",
//     "--output",
//     tempOut,
//     "--no-playlist",
//     url,
//   ];

//   const logPath = join(DOWNLOAD_DIR, `${id}.log`);
//   const logStream = createWriteStream(logPath, { flags: "a" });
//   const ytdlp = spawn("yt-dlp", args);

//   ytdlp.stdout.on("data", (data) => {
//     const msg = data.toString();
//     logStream.write(msg);
//     const match = msg.match(/(\d+\.\d)%/);
//     if (match) {
//       process.stdout.write(`\r📦 Download progress: ${match[1]}%`);
//     }
//   });

//   ytdlp.stderr.pipe(logStream);

//   ytdlp.on("close", (code) => {
//     console.log(`\n✅ yt-dlp finished with code ${code}`);
//     const file = readdirSync(DOWNLOAD_DIR).find(
//       (f) => f.startsWith(id) && (f.endsWith(".mkv") || f.endsWith(".webm") || f.endsWith(".mp4"))
//     );

//     if (!file) {
//       downloads[id] = null;
//       console.log("❌ No downloaded file found!");
//       return;
//     }

//     const inputPath = join(DOWNLOAD_DIR, file);

//     // Step 2: Re-encode to universal MP4 (slow but guaranteed playable)
//     console.log("🎞 Re-encoding to MP4 (H.264 + AAC)...");
//     try {
//       execSync(
//         `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${finalOut}"`,
//         { stdio: "inherit" }
//       );
//       downloads[id] = `${id}_final.mp4`;
//       console.log(`✅ Final video ready: ${finalOut}`);
//     } catch (err) {
//       console.error("❌ Re-encode failed:", err);
//       downloads[id] = null;
//     }
//   });

//   res.json({ jobId: id, status: "processing" });
// });

// // ------------------- GET /status/:id -------------------
// app.get("/status/:id", (req, res) => {
//   const id = req.params.id;
//   if (!(id in downloads))
//     return res.status(404).json({ error: "unknown id" });

//   const v = downloads[id];
//   if (v === "processing") return res.json({ status: "processing" });
//   if (v === null) return res.json({ status: "failed" });

//   const downloadUrl = `/file/${id}`;
//   res.json({ status: "ready", downloadUrl });
// });

// // ------------------- GET /file/:id -------------------
// app.get("/file/:id", (req, res) => {
//   const id = req.params.id;
//   const filename = downloads[id];
//   if (!filename || filename === "processing")
//     return res.status(404).send("Not ready yet");

//   const filePath = join(DOWNLOAD_DIR, filename);
//   res.download(filePath, filename, (err) => {
//     if (err) console.error(err);
//   });
// });

// // ------------------- Start Server -------------------
// app.listen(3000, () =>
//   console.log("🚀 Full HD Video Downloader running at http://localhost:3000")
// );







import express, { json } from "express";
import { spawn, execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  existsSync,
  mkdirSync,
  createWriteStream,
  readdirSync,
  unlinkSync,
} from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const DOWNLOAD_DIR = join(__dirname, "downloads");
if (!existsSync(DOWNLOAD_DIR)) mkdirSync(DOWNLOAD_DIR);

const downloads = {}; // jobId -> { status, filename, thumbnail }

// ------------------- UI -------------------
app.get("/", (req, res) => {
  res.render("index");
});

// ------------------- POST /download -------------------
app.post("/download", (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//.test(url))
    return res.render("index", { error: "Enter a valid video URL" });

  const id = uuidv4();
  const tempOut = join(DOWNLOAD_DIR, `${id}.%(ext)s`);
  const finalOut = join(DOWNLOAD_DIR, `${id}_final.mp4`);
  downloads[id] = { status: "processing", filename: null, thumbnail: null };

  console.log(`⬇️ Starting download for ${url}`);

  // Step 1: Get thumbnail URL
  const thumbProc = spawn("yt-dlp", ["--get-thumbnail", url]);
  thumbProc.stdout.on("data", (data) => {
    downloads[id].thumbnail = data.toString().trim();
  });

  // Step 2: Start download
  const args = [
    "--format",
    "bestvideo+bestaudio/best",
    "--merge-output-format",
    "mkv",
    "--output",
    tempOut,
    "--no-playlist",
    url,
  ];

  const logPath = join(DOWNLOAD_DIR, `${id}.log`);
  const logStream = createWriteStream(logPath, { flags: "a" });
  const ytdlp = spawn("yt-dlp", args);

  ytdlp.stdout.on("data", (data) => {
    const msg = data.toString();
    logStream.write(msg);
    const match = msg.match(/(\d+\.\d)%/);
    if (match) {
      downloads[id].progress = match[1];
    }
  });

  ytdlp.stderr.pipe(logStream);

  ytdlp.on("close", (code) => {
    console.log(`✅ yt-dlp finished with code ${code}`);
    const file = readdirSync(DOWNLOAD_DIR).find(
      (f) =>
        f.startsWith(id) &&
        (f.endsWith(".mkv") || f.endsWith(".webm") || f.endsWith(".mp4"))
    );

    if (!file) {
      downloads[id].status = "failed";
      console.log("❌ No downloaded file found!");
      return;
    }

    const inputPath = join(DOWNLOAD_DIR, file);

    // Step 3: Re-encode to universal MP4
    console.log("🎞 Re-encoding to MP4 (H.264 + AAC)...");
    try {
      execSync(
        `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -movflags +faststart "${finalOut}"`,
        { stdio: "inherit" }
      );
      downloads[id].status = "ready";
      downloads[id].filename = `${id}_final.mp4`;
      console.log(`✅ Final video ready: ${finalOut}`);

      // Delete temporary file
      try {
        unlinkSync(inputPath);
      } catch {}

      // Auto delete after 10 mins
      setTimeout(() => {
        try {
          unlinkSync(finalOut);
          delete downloads[id];
          console.log(`🧹 Deleted ${finalOut}`);
        } catch {}
      }, 1000 * 60 * 10);
    } catch (err) {
      console.error("❌ Re-encode failed:", err);
      downloads[id].status = "failed";
    }
  });

  res.redirect(`/progress/${id}`);
});

// ------------------- Progress Page -------------------
app.get("/progress/:id", (req, res) => {
  const id = req.params.id;
  const data = downloads[id];
  if (!data) return res.status(404).send("Invalid job ID");
  res.render("progress", { id, data });
});

// ------------------- Polling for Progress -------------------
app.get("/status/:id", (req, res) => {
  const id = req.params.id;
  const data = downloads[id];
  if (!data) return res.json({ status: "not_found" });
  res.json(data);
});

// ------------------- Serve file -------------------
app.get("/file/:id", (req, res) => {
  const id = req.params.id;
  const data = downloads[id];
  if (!data?.filename) return res.status(404).send("Not ready yet");

  const filePath = join(DOWNLOAD_DIR, data.filename);
  res.download(filePath, "video.mp4");
});

// ------------------- Start Server -------------------
app.listen(3000, () =>
  console.log("🚀 Full HD Downloader at http://localhost:3000")
);
