import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";

const uploadDirectory = path.resolve("uploads/documents");

// Ensure upload directory exists
fs.mkdirSync(uploadDirectory, {
    recursive: true,
});

const storage = multer.diskStorage({
    destination: (
        _req,
        _file,
        callback
    ) => {
        callback(null, uploadDirectory);
    },

    filename: (
        _req,
        file,
        callback
    ) => {
        const extension = path.extname(file.originalname);
        const filename = `${crypto.randomUUID()}${extension}`;

        callback(null, filename);
    },
});

const allowedMimeTypes = new Set([
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "text/plain",
]);

export const documentUpload = multer({
    storage,

    limits: {
        fileSize: 10 * 1024 * 1024,
    },

    fileFilter: (
        _req,
        file,
        callback
    ) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(
                new Error(
                    "Only PDF, DOCX and TXT files are supported"
                )
            );

            return;
        }

        callback(null, true);
    },
});