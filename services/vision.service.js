/**
 * vision.service.js — The only file that talks to the Python AI service.
 *
 * Why isolate this in a service?
 * If you swap the Python service for a cloud API (AWS Rekognition, Azure Face)
 * later, you change ONLY this file. The controller never needs to know.
 *
 * We use axios with FormData to send multipart/form-data — the same format
 * a browser uses when submitting a file upload form.
 *
 * IMPORTANT: We receive the file buffer from multer (in memory), then
 * forward it to Python. The file never touches disk on the Node.js side.
 */
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const PYTHON_URL = process.env.PYTHON_AI_URL || "http://localhost:8001";

/**
 * Enroll a person's face in the AI system.
 *
 * @param {Buffer} fileBuffer  - Raw image bytes from multer
 * @param {string} mimetype    - e.g. "image/jpeg"
 * @param {string} name        - Person's full name
 * @param {string} person_id   - Optional stable ID
 * @returns {object}           - Python service response
 */
const enrollFace = async (fileBuffer, mimetype, name, person_id) => {
    const form = new FormData();
    form.append("name", name);

    // Append the buffer as a file - FormData needs filename + contentType
    form.append("photo", fileBuffer, {
        filename: "photo.jpg",
        contentType: mimetype,
    });

    const response = await axios.post(`${PYTHON_URL}/enroll`, form, {
        headers: form.getHeaders(),
        timeout: 30000, // 30s - dlib can be slow on first run
    });

    return response.data;
};

/**
 * Recognize faces in an image.
 *
 * @param {Buffer} fileBuffer  - Raw image bytes from multer
 * @param {string} mimetype    - e.g. "image/jpeg"
 * @returns {object}           - Python service response with matches
 */
const recognizeFaces = async (fileBuffer, mimetype) => {
    const form = new FormData();
    form.append("photo", fileBuffer, {
        filename: "photo.jpg",
        contentType: mimetype,
    });

    const response = await axios.post(`${PYTHON_URL}/recognize`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
    });

    return response.data;
};

/**
 * Get all enrolled people from the Python service.
 */
const getEnrolled = async () => {
    const response = await axios.get(`${PYTHON_URL}/enrolled`);
    return response.data;
};

module.exports = { enrollFace, recognizeFaces, getEnrolled };