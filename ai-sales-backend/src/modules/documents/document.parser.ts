import mammoth from "mammoth";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

export async function extractTextFromFile(
    filePath: string,
    mimeType?: string
): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (
        mimeType === "text/plain" ||
        mimeType === "text/csv" ||
        mimeType === "application/csv" ||
        mimeType === "application/json" ||
        mimeType === "text/json" ||
        mimeType === "text/tab-separated-values" ||
        [".txt", ".csv", ".json", ".tsv", ".md", ".yaml", ".yml"].includes(ext)
    ) {
        return fs.readFile(filePath, "utf-8");
    }

    if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === ".docx"
    ) {
        const result = await mammoth.extractRawText({
            path: filePath,
        });
        return result.value;
    }

    if (mimeType === "application/pdf" || ext === ".pdf") {
        const buffer = await fs.readFile(filePath);
        const parser = new PDFParse({
            data: buffer,
        });

        try {
            const result = await parser.getText();
            return result.text;
        } finally {
            await parser.destroy();
        }
    }

    // Default fallback: try reading as utf-8
    try {
        return await fs.readFile(filePath, "utf-8");
    } catch {
        throw new Error(`Unsupported file type: ${mimeType || ext}`);
    }
}