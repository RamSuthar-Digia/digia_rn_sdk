/**
 * AdaptedFile - TypeScript counterpart of the Dart `AdaptedFile`.
 *
 * This is a lightweight adapter to represent a picked file across platforms.
 * It intentionally keeps types generic (`any`) for file-picker/XFile bindings
 * to avoid hard runtime dependencies on optional modules.
 */

import { ExprInstance } from "@digia/expr-rn";

export type ReadStreamLike = AsyncIterable<Uint8Array> | NodeJS.ReadableStream;

export class AdaptedFile implements ExprInstance {
    path: string | null = null;
    name: string | null = null;
    size: number | null = null;
    bytes: Uint8Array | null = null;
    readStream: ReadStreamLike | null = null;
    identifier: string | null = null;
    xFile: any | null = null;

    constructor() { }

    setData(data: {
        path?: string | null;
        name?: string | null;
        size?: number | null;
        bytes?: Uint8Array | ArrayBuffer | null;
        readStream?: ReadStreamLike | null;
        identifier?: string | null;
        xFile?: any | null;
    }) {
        this.path = data.path ?? null;
        this.name = data.name ?? null;
        this.size = typeof data.size === 'number' ? data.size : null;
        if (data.bytes instanceof Uint8Array) this.bytes = data.bytes;
        else if (data.bytes instanceof ArrayBuffer) this.bytes = new Uint8Array(data.bytes);
        else this.bytes = null;
        this.readStream = data.readStream ?? null;
        this.identifier = data.identifier ?? null;
        this.xFile = data.xFile ?? null;
    }

    setDataFromAdaptedFile(adaptedFile: AdaptedFile) {
        this.setData({
            path: adaptedFile.path,
            name: adaptedFile.name,
            size: adaptedFile.size ?? null,
            bytes: adaptedFile.bytes ?? null,
            readStream: adaptedFile.readStream ?? null,
            identifier: adaptedFile.identifier ?? null,
            xFile: adaptedFile.xFile ?? null,
        });
    }

    get isWeb(): boolean {
        const g: any = globalThis as any;
        const hasWindow = typeof g.window !== 'undefined';
        const hasDocument = typeof g.document !== 'undefined';
        return !!hasWindow && !!hasDocument;
    }

    get isMobile(): boolean {
        return !this.isWeb;
    }

    // Create from a generic PlatformFile-like object (keeps it flexible)
    static fromPlatformFile(platformFile: any): AdaptedFile {
        const f = new AdaptedFile();
        // On web, path is typically unavailable
        f.path = typeof platformFile?.path === 'string' ? platformFile.path : null;
        f.name = platformFile?.name ?? null;
        f.size = typeof platformFile?.size === 'number' ? platformFile.size : null;
        if (platformFile?.bytes instanceof Uint8Array) f.bytes = platformFile.bytes;
        else if (platformFile?.bytes instanceof ArrayBuffer) f.bytes = new Uint8Array(platformFile.bytes);
        else f.bytes = null;
        f.readStream = platformFile?.readStream ?? null;
        f.identifier = platformFile?.identifier ?? null;
        return f;
    }

    // Create from an XFile-like object (keeps it flexible)
    static fromXFile(xFile: any): AdaptedFile {
        const f = new AdaptedFile();
        f.name = xFile?.name ?? null;
        f.path = xFile?.path ?? null;
        f.xFile = xFile ?? null;
        return f;
    }

    // Minimal expression engine compatibility: expose a small set of fields
    getField(name: string): any {
        switch (name) {
            case 'name':
                return this.name;
            case 'size':
                return this.size;
            case 'identifier':
                return this.identifier;
            default:
                return null;
        }
    }
}

export default AdaptedFile;
