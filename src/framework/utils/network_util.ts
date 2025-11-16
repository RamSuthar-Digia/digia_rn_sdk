import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { apiHandler } from '../../core/action/api_handler';
import { APIModel } from '../../network/api_request/api_request';
import { ExprOr } from '../models/types';
import { DefaultScopeContext } from '../expr/default_scope_context';
import { ScopeContext } from '../expr/scope_context';
import { JsonLike } from './types';

/**
 * Execute an APIModel using the project's ApiHandler and evaluate optional
 * success conditions and callbacks.
 */
export async function executeApiAction(
    scopeContext: ScopeContext | null | undefined,
    apiModel: APIModel,
    args?: Record<string, ExprOr<any> | null> | null,
    options?: {
        successCondition?: ExprOr<boolean> | null;
        onSuccess?: (response: JsonLike) => Promise<void> | void;
        onError?: (response: JsonLike) => Promise<void> | void;
    }
): Promise<AxiosResponse<any>> {
    const evaluatedArgs: Record<string, any> | null = apiModel.variables
        ? Object.fromEntries(
            Object.entries(apiModel.variables).map(([k, v]) => {
                const provided = args?.[k];
                const val = provided ? provided.evaluate(scopeContext) : v.defaultValue;
                return [k, val];
            })
        )
        : null;

    try {
        const response = await apiHandler.execute({ apiModel, args: evaluatedArgs });

        const respObj: JsonLike = {
            body: response.data,
            statusCode: response.status,
            headers: response.headers,
            requestObj: _requestObjToMap(response.config),
            error: null,
        };

        const isSuccess = options?.successCondition
            ? options.successCondition.evaluate(
                new DefaultScopeContext({ variables: { response: respObj }, enclosing: scopeContext })
            ) ?? true
            : true;

        if (isSuccess) {
            await options?.onSuccess?.(respObj);
        } else {
            await options?.onError?.(respObj);
        }

        return response;
    } catch (error: any) {
        // axios errors include a response; mirror Dart's DioException handling
        if (error && error.response) {
            const resp = error.response as AxiosResponse<any>;
            const respObj: JsonLike = {
                body: resp.data,
                statusCode: resp.status,
                headers: resp.headers,
                requestObj: _requestObjToMap(resp.config),
                error: error.message ?? String(error),
            };
            await options?.onError?.(respObj);
        }
        throw error;
    }
}

function _requestObjToMap(config?: AxiosRequestConfig | null): JsonLike {
    if (!config) return {};
    return {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        queryParameters: (config.params ?? {}),
    };
}

export function hasExtension(src: string, exts: string[]): boolean {
    try {
        const url = new URL(src);
        const lowerPath = (url.pathname || src).toLowerCase().split('?')[0].split('#')[0];
        const normalized = exts.map((e) => e.toLowerCase());
        if (normalized.some((ext) => lowerPath.endsWith(ext))) return true;
        if (src.startsWith('data:')) {
            const lower = src.toLowerCase();
            if (normalized.some((ext) => lower.startsWith(`data:image/${ext}`))) return true;
        }
        return false;
    } catch (e) {
        // If URL parsing fails, fall back to string checks
        const lowerPath = src.toLowerCase().split('?')[0].split('#')[0];
        const normalized = exts.map((e) => e.toLowerCase());
        if (normalized.some((ext) => lowerPath.endsWith(ext))) return true;
        if (src.startsWith('data:')) {
            const lower = src.toLowerCase();
            if (normalized.some((ext) => lower.startsWith(`data:image/${ext}`))) return true;
        }
        return false;
    }
}
