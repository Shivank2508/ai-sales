import mammoth from "mammoth";
import fs from "node:fs/promises";
import { PDFParse } from "pdf-parse";
export async function extractTextFromFile(
    filePath: string,
    mimeType: string
): Promise<string> {

    switch (mimeType) {
        case "text/plain":
            return fs.readFile(filePath, "utf-8")

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
            const result =
                await mammoth.extractRawText({
                    path: filePath,
                });

            return result.value;
        }

        case "application/pdf": {
            const buffer =
                await fs.readFile(filePath);

            const parser = new PDFParse({
                data: buffer,
            });

            try {
                const result =
                    await parser.getText();

                return result.text;
            } finally {
                await parser.destroy();
            }
        }

        default:
            throw new Error(
                `Unsupported MIME type: ${mimeType}`
            );
    }
}