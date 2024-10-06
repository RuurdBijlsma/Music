// A function to calculate the relative luminance of an RGB color
export function getRelativeLuminance(rgb: number[]): number {
    // Apply a linear transformation to each component
    const [r, g, b] = rgb.map((c) => {
        c /= 255 // Normalize to [0, 1]
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    // Return the weighted sum of the components
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function RGBToHSL(r: number, g: number, b: number) {
    r /= 255
    g /= 255
    b /= 255
    const l = Math.max(r, g, b)
    const s = l - Math.min(r, g, b)
    const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0
    return [
        60 * h < 0 ? 60 * h + 360 : 60 * h,
        100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
        (100 * (2 * l - s)) / 2
    ]
}

export function RGBToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// A function to calculate the contrast ratio between two RGB colors
export function getContrastRatio(rgb1: number[], rgb2: number[]): number {
    // Get the relative luminance of each color
    const l1 = getRelativeLuminance(rgb1)
    const l2 = getRelativeLuminance(rgb2)
    // Return the ratio of the larger luminance to the smaller luminance
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
