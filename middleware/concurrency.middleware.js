// middleware/concurrency.middleware.js
let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 8; // bounds worst case to ~8 * 10MB = 80MB of buffers at once

const limitConcurrentUploads = (req, res, next) => {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return res.status(503).json({ error: "Server is busy processing other uploads. Please try again in a moment." });
  }

  activeUploads++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      activeUploads--;
    }
  };
  res.on("finish", release);
  res.on("close", release); // handles client disconnects too

  next();
};

module.exports = limitConcurrentUploads;