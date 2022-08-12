import fs from "node:fs/promises";

export const tryLoadUtf8 = async (filepath, format = "text") => {
    try {
        const content = await fs.readFile(filepath, { encoding: "utf8" });
        if (format === 'json') {
            return JSON.parse(content);
        }
        return content;
    } catch (_) {
        return null;
    }
}