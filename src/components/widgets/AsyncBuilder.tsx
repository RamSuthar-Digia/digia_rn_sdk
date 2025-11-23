import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { DefaultScopeContext } from '../../framework/expr/default_scope_context';
import { ScopeContext } from '../../framework/expr/scope_context';
import InternalAsyncBuilder from '../internals/async/async_builder';
import AsyncController from '../internals/async/async_controller';
import { RenderPayload } from '../../framework/render_payload';
import { AsyncBuilderProps } from '../widget_props/async_builder_props';
import { JsonLike } from '../../framework/utils/types';
import { executeApiAction } from '../../framework/utils/network_util';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { APIModel } from '../../network/api_request/api_request';
import { as$ } from '../../framework';

export enum FutureState {
    loading = 'loading',
    completed = 'completed',
    error = 'error',
}

export enum FutureType {
    api = 'api',
}

export class VWAsyncBuilder extends VirtualStatelessWidget<AsyncBuilderProps> {
    constructor(options: {
        props: AsyncBuilderProps;
        commonProps?: any;
        parentProps?: any;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const child = this.child;

        // Evaluate controller expression if provided and set its future creator
        const evaluatedController = payload.evalExpr<AsyncController<any>>(this.props.controller, { type: 'asyncController' }) ?? undefined;
        if (evaluatedController) {
            evaluatedController.setFutureCreator(() => this._makeFuture(this.props, payload));
        }

        return (
            <InternalAsyncBuilder
                initialData={payload.evalExpr(this.props.initialData) ?? null}
                controller={evaluatedController}
                futureFactory={() => this._makeFuture(this.props, payload)}
                builder={(snapshot) => {
                    const futureType = this._getFutureType(this.props, payload);
                    const updatedPayload = payload.copyWithChainedContext(
                        this._createExprContext(snapshot, futureType)
                    );
                    return child?.toWidget(updatedPayload) ?? this.empty();
                }}
            />
        );
    }

    private _getFutureType(props: AsyncBuilderProps, payload: RenderPayload): FutureType | null {
        const futureProps = payload.evalExpr<JsonLike>(props.future);
        const type = futureProps?.['futureType'] as string | undefined;
        switch (type) {
            case 'api':
                return FutureType.api;
            default:
                return null;
        }
    }

    private _getFutureState(snapshot: { data?: any; error?: any; loading: boolean }): FutureState {
        if (snapshot.error) return FutureState.error;
        if (snapshot.loading) return FutureState.loading;
        return FutureState.completed;
    }

    private _createExprContext(snapshot: { data?: any; error?: any; loading: boolean }, futureType: FutureType | null): ScopeContext {
        const futureState = this._getFutureState(snapshot);
        if (futureType === FutureType.api) {
            return this._createApiExprContext(snapshot, futureState);
        }
        return this._createDefaultExprContext(snapshot, futureState);
    }

    private _createApiExprContext(snapshot: { data?: any; error?: any; loading: boolean }, futureState: FutureState): ScopeContext {
        let dataKey: any = undefined;
        let responseKey: JsonLike | undefined = undefined;

        switch (futureState) {
            case FutureState.loading:
                dataKey = snapshot.data;
                break;
            case FutureState.error: {
                const err = snapshot.error as any;
                if (err && err.response) {
                    const resp = err.response as AxiosResponse<any>;
                    responseKey = {
                        statusCode: resp.status,
                        headers: resp.headers,
                        requestObj: this._requestObjToMap(resp.config),
                        error: err.message ?? String(err),
                    };
                } else {
                    responseKey = { error: String(snapshot.error) };
                }
                break;
            }
            case FutureState.completed: {
                const apiResponse = as$<AxiosResponse<any>>(snapshot.data);
                if (apiResponse) {
                    dataKey = apiResponse.data;
                    responseKey = {
                        body: apiResponse.data,
                        statusCode: apiResponse.status,
                        headers: apiResponse.headers,
                        requestObj: this._requestObjToMap(apiResponse.config),
                    };
                } else {
                    responseKey = { error: 'Unknown Error' };
                }
                break;
            }
        }

        const respObj: JsonLike = {
            futureState: futureState,
            futureValue: dataKey,
            response: responseKey,
        };

        const vars: Record<string, any> = { ...respObj };
        if (this.refName) vars[this.refName] = respObj;

        return new DefaultScopeContext({ variables: vars });
    }

    private _createDefaultExprContext(snapshot: { data?: any; error?: any; loading: boolean }, futureState: FutureState): ScopeContext {
        const respObj: Record<string, any> = {
            futureState,
            futureValue: snapshot.data,
        };
        if (snapshot.error) respObj['error'] = snapshot.error;

        const vars: Record<string, any> = { ...respObj };
        if (this.refName) vars[this.refName] = respObj;

        return new DefaultScopeContext({ variables: vars });
    }

    private async _makeFuture(props: AsyncBuilderProps, payload: RenderPayload): Promise<any> {
        const futureProps = payload.evalExpr<JsonLike>(props.future);
        if (!futureProps) return Promise.reject('Future props not provided');

        const type = this._getFutureType(props, payload);
        if (!type) return Promise.resolve(null);

        switch (type) {
            case FutureType.api:
                return this._makeApiFuture(futureProps, payload, props);
        }
    }

    private async _makeApiFuture(futureProps: JsonLike, payload: RenderPayload, props: AsyncBuilderProps): Promise<AxiosResponse<any>> {
        const dataSource = futureProps['dataSource'] as JsonLike | undefined;
        const apiDataSourceId = dataSource?.['id'] as string | undefined;
        if (!apiDataSourceId) return Promise.reject('No API Selected');

        const apiModel = payload.getApiModel(apiDataSourceId) as APIModel | null;
        if (!apiModel) return Promise.reject('No API Selected');

        const args = (as$<JsonLike>(dataSource?.['args']) ?? {}) as Record<string, any>;
        const exprArgs: Record<string, any> = {};
        for (const [k, v] of Object.entries(args)) {
            // Use ExprOr.fromJson where available
            const { ExprOr } = require('../../framework/models/types');
            exprArgs[k] = ExprOr.fromJson(v);
        }

        return executeApiAction(payload.context.scopeContext, apiModel, exprArgs, {
            onSuccess: async (response) => {
                await payload.copyWithChainedContext(new DefaultScopeContext({ variables: { response } })).executeAction(props.onSuccess, { triggerType: 'onSuccess' } as any);
            },
            onError: async (response) => {
                await payload.copyWithChainedContext(new DefaultScopeContext({ variables: { response } })).executeAction(props.onError, { triggerType: 'onError' } as any);
            },
        });
    }

    private _requestObjToMap(config?: AxiosRequestConfig | null): JsonLike | null {
        if (!config) return null;
        return {
            url: (config.url as string) ?? undefined,
            method: config.method,
            headers: config.headers,
            data: (config as any).data,
            queryParameters: (config.params ?? {}),
        };
    }
}

export default VWAsyncBuilder;
