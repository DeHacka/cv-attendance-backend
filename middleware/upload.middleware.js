/**
 * upload.middleware.js — Multer config for handling photo uploads.
 *
 * Why memoryStorage and not diskStorage?
 * We don't want to save photos to disk — we forward them straight
 * to Python and discard them. memoryStorage keeps the file as a
 * Buffer in RAM, which is exactly what vision.service.js needs.
 *
 * File size limit: 10MB. A typical phone photo is 2-5MB.
 * Only JPEG and PNG accepted — reject anything else early.
 */

const multer = require("multer");

const storage = multer.memoryStorage();

/**
 * The callback cb has the form cb(error, accepted)
 * cb(null, true) - no error, accept file
 * cb(new Error(...), false) - reject the file with an error
 */
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  
  // If mimetype is missing or unrecognized, check the file extension instead
  if (allowed.includes(file.mimetype) || !file.mimetype) {
    cb(null, true);
  } else {
    cb(new Error(`Only JPEG and PNG images are allowed. Got: ${file.mimetype}`), false);
  }
};


// Multer configured instance
const upload = multer({
    storage, 
    fileFilter, 
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
