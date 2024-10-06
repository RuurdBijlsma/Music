import { Ref, ref, toRaw, watch } from 'vue'
import { baseDb } from './database'
import log from 'electron-log/renderer'

export function hexToRgb(hex: string) {
    if (hex.length === 4) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    }

    if (hex.length !== 7 || hex[0] !== '#') {
        log.warn('Got invalid hex format', hex, 'returning rgb(0,0,0)')
        return [0, 0, 0] // Invalid hex format
    }

    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        log.warn('Got invalid hex format', hex, 'returning rgb(0,0,0)')
        return [0, 0, 0] // Invalid hex format
    }

    return [r, g, b]
}

export function deltaE(rgbA: number[], rgbB: number[]) {
    const labA = rgb2lab(rgbA)
    const labB = rgb2lab(rgbB)
    const deltaL = labA[0] - labB[0]
    const deltaA = labA[1] - labB[1]
    const deltaB = labA[2] - labB[2]
    const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2])
    const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2])
    const deltaC = c1 - c2
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH)
    const sc = 1.0 + 0.045 * c1
    const sh = 1.0 + 0.015 * c1
    const deltaLKlsl = deltaL
    const deltaCkcsc = deltaC / sc
    const deltaHkhsh = deltaH / sh
    const i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh
    return i < 0 ? 0 : Math.sqrt(i)
}

export function hmsToSeconds(time: string): number {
    const parts = time.split(':').map((part) => parseInt(part, 10))
    let milliseconds = 0

    if (parts.length === 3) {
        // If the input is in the format "hours:minutes:seconds"
        const [hours, minutes, seconds] = parts
        milliseconds = hours * 60 * 60 + minutes * 60 + seconds
    } else if (parts.length === 2) {
        // If the input is in the format "minutes:seconds"
        const [minutes, seconds] = parts
        milliseconds = minutes * 60 + seconds
    } else {
        throw new Error(
            'Invalid time format. Please use "hours:minutes:seconds" or "minutes:seconds".'
        )
    }

    return milliseconds
}

export function rgb2lab(rgb: number[]) {
    let r = rgb[0] / 255,
        g = rgb[1] / 255,
        b = rgb[2] / 255,
        x,
        y,
        z
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

export async function executeCached<T>(
    fun: () => T,
    cacheKey: string,
    expireTime: number,
    useCache = true
): Promise<T> {
    const db = await baseDb
    if (useCache) {
        const cache = await db.get('cache', cacheKey)
        if (cache) {
            if (cache.expiryDate < Date.now()) db.delete('cache', cacheKey).then()
            else return cache.result
        }
    }
    const result = await fun()
    db.put(
        'cache',
        {
            result,
            expiryDate: Date.now() + expireTime
        },
        cacheKey
    ).then()

    return result
}

export function caps(str: string) {
    return str[0].toUpperCase() + str.slice(1)
}

export function encodeUrlName(name: string) {
    if (name.trim() === '') return '_'
    const toEncode = name.toLowerCase().replace(/ /gi, '-').slice(0, 36)
    let encoded: string
    try {
        encoded = encodeURIComponent(toEncode)
    } catch (e) {
        encoded = toEncode.replace(/[^a-z0-9]/gi, '')
    }
    return encoded
}

export function approximateDuration(millis: number) {
    if (millis > 7200000) return Math.round(millis / 3600000) + ' hours'
    const minutes = Math.round(millis / 60000)
    return minutes + ' minute' + (minutes === 1 ? '' : 's')
}

export function msToReadable(millis: number) {
    if (isNaN(millis) || millis === undefined) return '0:00'

    const seconds = Math.round(millis / 1000)
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const hString = h.toString()
    let mString = m.toString()
    let sString = s.toString()
    if (hString !== '0') {
        mString = mString.padStart(2, '0')
        sString = sString.padStart(2, '0')
    }
    sString = sString.padStart(2, '0')

    if (hString === '0') return `${mString}:${sString}`
    else return `${hString}:${mString}:${sString}`
}

export function persistentRef<T>(storeKey: string, startValue: T, deep = false) {
    const valueType = typeof startValue
    let fromString = (v) => v
    let toString = (v) => v
    if (valueType === 'boolean') {
        fromString = (v) => v === 'true'
        toString = (v) => v.toString()
    } else if (valueType === 'number') {
        fromString = (v) => +v
        toString = (v) => v.toString()
    } else if (valueType !== 'string') {
        fromString = (v) => JSON.parse(v)
        toString = (v) => JSON.stringify(toRaw(v))
    }

    if (localStorage.getItem(storeKey) === null) localStorage[storeKey] = toString(startValue)
    const result: Ref<T> = ref(
        localStorage.getItem(storeKey) === null ? startValue : fromString(localStorage[storeKey])
    )
    watch(
        result,
        () => {
            localStorage[storeKey] = toString(result.value)
        },
        { deep }
    )
    return result
}
