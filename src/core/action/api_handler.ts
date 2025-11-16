import { AxiosResponse, CancelToken } from 'axios';
import { DigiaUIManager } from '../../init/digia_ui_manager';
import { APIModel } from '../../network/api_request/api_request';
import { BodyType } from '../../network/types';
import { NetworkClient } from '../../network/network_client';

/**
 * Simple API handler that mirrors the Dart ApiHandler implementation.
 *
 * Responsible for hydrating templates, preparing request data (including
 * multipart/form-data) and delegating to the configured NetworkClient.
 */
export class ApiHandler {
    private static _instance: ApiHandler | null = null;

    static get instance(): ApiHandler {
        if (!ApiHandler._instance) ApiHandler._instance = new ApiHandler();
        return ApiHandler._instance;
    }

    private apiVariableRegex = /\{\{([\w\.\-]+)\}\}/g;

    async execute(options: {
        apiModel: APIModel;
        args?: Record<string, any> | null;
        progressCallback?: (progress: { count: number; total: number; progress: number }) => void;
        cancelToken?: CancelToken;
    }): Promise<AxiosResponse<any>> {
        const { apiModel, args, progressCallback, cancelToken } = options;

        const manager = DigiaUIManager.getInstance();
        const envVariables = manager.environmentVariables ?? {};

        // Build env args map with default values
        const envArgs: Record<string, any> = {};
        for (const [k, v] of Object.entries(envVariables)) {
            envArgs[`env.${k}`] = (v as any).defaultValue;
        }

        const finalArgs: Record<string, any> = { ...envArgs, ...(args ?? {}) };

        let url = this._hydrateTemplate(apiModel.url, finalArgs);

        const host = manager.host;
        // Mirror Dart logic: if host is dashboard and resourceProxyUrl present and url startsWith http:, prefix proxy
        if ((host as any)?.resourceProxyUrl && url.startsWith('http:')) {
            url = `${(host as any).resourceProxyUrl}${url}`;
        }

        const headers = apiModel.headers
            ? Object.fromEntries(Object.entries(apiModel.headers).map(([k, v]) => [this._hydrateTemplate(k, finalArgs), this._hydrateTemplate(String(v), finalArgs)]))
            : undefined;

        const body = apiModel.body ? this._hydrateTemplateInDynamic(apiModel.body, finalArgs) : null;

        const bodyType = apiModel.bodyType ?? BodyType.JSON;

        const networkClient = manager.networkClient as NetworkClient;

        if (bodyType === BodyType.MULTIPART) {
            const prepared = await this._createFormData(body);
            const resp = await networkClient.multipartRequestProject({
                bodyType,
                url,
                method: apiModel.method as any,
                additionalHeaders: headers,
                data: prepared,
                cancelToken,
                apiName: apiModel.name,
                uploadProgress: (sent: number, total: number) => {
                    progressCallback?.({ count: sent, total, progress: (sent / total) * 100 });
                },
            });
            return resp;
        }

        const prepared = this._prepareRequestData(body, bodyType);

        const resp = await networkClient.requestProject({
            bodyType,
            url,
            method: apiModel.method as any,
            additionalHeaders: headers,
            cancelToken,
            data: prepared,
            apiName: apiModel.name,
        });

        return resp;
    }

    private _hydrateTemplate(template: string, values?: Record<string, any> | null): string {
        if (!template) return template;
        return template.replace(this.apiVariableRegex, (match, g1) => {
            const v = values?.[g1];
            return v != null ? String(v) : match;
        });
    }

    private _hydrateTemplateInDynamic(json: any, values?: Record<string, any> | null): any {
        if (json == null) return null;
        if (typeof json === 'number' || typeof json === 'boolean') return json;
        if (Array.isArray(json)) return json.map((e) => this._hydrateTemplateInDynamic(e, values));
        if (typeof json === 'object') {
            const out: Record<string, any> = {};
            for (const [k, v] of Object.entries(json)) {
                out[this._hydrateTemplateInDynamic(k, values)] = this._hydrateTemplateInDynamic(v, values);
            }
            return out;
        }
        if (typeof json !== 'string') return json;
        // Replace variables in string
        const m = this.apiVariableRegex.exec(json);
        this.apiVariableRegex.lastIndex = 0;
        if (m) {
            const varName = m[1];
            return values?.[varName] ?? json;
        }
        // Replace all occurrences
        return json.replace(this.apiVariableRegex, (match, g1) => {
            return values?.[g1] != null ? String(values[g1]) : match;
        });
    }

    private async _createFormData(finalData: any): Promise<any> {
        const formData = new FormData();
        if (!finalData || typeof finalData !== 'object') return formData;

        for (const [key, val] of Object.entries(finalData)) {
            if (val == null) continue;

            // If it's already a File-like object for React Native (has uri)
            if (typeof val === 'object' && ('uri' in val || 'path' in val)) {
                // Expect { uri, name?, type? }
                const fileObj: any = val;
                const name = fileObj.name ?? (fileObj.path ? fileObj.path.split('/').pop() : 'file');
                const type = fileObj.type ?? undefined;
                // @ts-ignore - React Native FormData accepts { uri, name, type }
                formData.append(key, { uri: fileObj.uri ?? fileObj.path, name, type });
                continue;
            }

            // If value is an array, append each
            if (Array.isArray(val)) {
                for (const v of val) {
                    if (typeof v === 'object' && ('uri' in v || 'path' in v)) {
                        const fileObj: any = v;
                        const name = fileObj.name ?? (fileObj.path ? fileObj.path.split('/').pop() : 'file');
                        const type = fileObj.type ?? undefined;
                        // @ts-ignore
                        formData.append(key, { uri: fileObj.uri ?? fileObj.path, name, type });
                    } else {
                        formData.append(key, String(v));
                    }
                }
                continue;
            }

            // Primitive
            formData.append(key, String(val));
        }

        return formData;
    }

    private _prepareRequestData(body: any, bodyType: BodyType): any {
        // For JSON/form-url-encoded we return the body as-is
        return body;
    }
}

export const apiHandler = ApiHandler.instance;
