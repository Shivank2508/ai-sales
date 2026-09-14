export interface TextChunk {
    content: string;
    chunkIndex: number;
}

export function chunkText(
    text: string,
    chunkSize = 1500,
    overlap = 200
): TextChunk[] {
    if (!text.trim()) {
        return [];
    }

    if (overlap >= chunkSize) {
        throw new Error(
            "Chunk overlap must be smaller than chunk size"
        );
    }
    const chunks: TextChunk[] = []

    let start = 0
    let index = 0

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length)
        const content = text.slice(start, end).trim()
        if (content) {
            chunks.push({ content, chunkIndex: index })
            index += 1
        }
        if (end === text.length) {
            break
        }

        start = end - overlap
    }
    return chunks;
}