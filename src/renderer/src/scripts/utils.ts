export function hexToRgb(hex: string) {
    if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }

    if (hex.length !== 7 || hex[0] !== "#") {
        console.warn("Got invalid hex format", hex, "returning rgb(0,0,0)");
        return [0, 0, 0]; // Invalid hex format
    }

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.warn("Got invalid hex format", hex, "returning rgb(0,0,0)");
        return [0, 0, 0]; // Invalid hex format
    }

    return [r, g, b];
}

export function deltaE(rgbA: number[], rgbB: number[]) {
    let labA = rgb2lab(rgbA);
    let labB = rgb2lab(rgbB);
    let deltaL = labA[0] - labB[0];
    let deltaA = labA[1] - labB[1];
    let deltaB = labA[2] - labB[2];
    let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    let deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    let sc = 1.0 + 0.045 * c1;
    let sh = 1.0 + 0.015 * c1;
    let deltaLKlsl = deltaL;
    let deltaCkcsc = deltaC / sc;
    let deltaHkhsh = deltaH / sh;
    let i =
        deltaLKlsl * deltaLKlsl +
        deltaCkcsc * deltaCkcsc +
        deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
}

export function hmsToSeconds(time: string): number {
    const parts = time.split(":").map((part) => parseInt(part, 10));
    let milliseconds = 0;

    if (parts.length === 3) {
        // If the input is in the format "hours:minutes:seconds"
        const [hours, minutes, seconds] = parts;
        milliseconds = hours * 60 * 60 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
        // If the input is in the format "minutes:seconds"
        const [minutes, seconds] = parts;
        milliseconds = minutes * 60 + seconds;
    } else {
        throw new Error(
            'Invalid time format. Please use "hours:minutes:seconds" or "minutes:seconds".',
        );
    }

    return milliseconds;
}

export function rgb2lab(rgb: number[]) {
    let r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        x,
        y,
        z;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function executeCached<T>(
    db,
    fun,
    cacheKey,
    expireTime,
): Promise<T> {
    let ytCache = await db.get("cache", cacheKey);
    if (ytCache) {
        if (ytCache.expiryDate < Date.now())
            db.delete("cache", cacheKey).then();
        else return ytCache.result;
    }
    let result = await fun();
    db.put(
        "cache",
        {
            result,
            expiryDate: Date.now() + expireTime,
        },
        cacheKey,
    ).then();

    return result;
}
