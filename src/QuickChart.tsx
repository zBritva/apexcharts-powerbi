/* eslint-disable max-lines-per-function */
import React from "react";
import Handlebars from "handlebars";
import JSON5 from 'json5'

import powerbiApi from "powerbi-visuals-api";
import DataView = powerbiApi.DataView;

import { ErrorViewer } from "./Error";

import { Button, Flex, Layout, theme } from 'antd';
import { applyMapping, getChartColumns, verifyColumns, uncommentCodeComments, Table } from "./utils";
import { Mapping } from "./Mapping";
import { Viewer } from "./View";
import { ErrorBoundary } from "./ErrorBoundary";


import { hardReset, registerGlobal } from "./handlebars/helpers";
import { useAppSelector } from "./redux/hooks";

import "./handlebars/helpers";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const { Content, Sider } = Layout;


export interface QuickChartProps {
    width: number;
    height: number;
    table: Table;
    dataView: DataView;
    current: string;
    onSave: (json: string) => void;

    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onHover?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onHoverEnd?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onResetSelection?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/* eslintd-isable max-lines-per-function */
export const QuickChart: React.FC<QuickChartProps> = ({
    height, width, table: visualDataset, dataView, current,
    onSave, onClick, onContextMenu, onHover, onHoverEnd, onResetSelection
}) => {

    const [error] = React.useState<string>(null);
    const [schema, setSchema] = React.useState<string>(current);
    const host = useAppSelector((state) => state.options.host);

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const dataset = visualDataset;
    const table = useAppSelector((state) => state.options.table);
    const viewport = useAppSelector((state) => state.options.viewport);

    const template = React.useMemo(() => {
        const charttmpl = uncommentCodeComments(schema);
        console.log('charttmpl quick chart', charttmpl);
        return Handlebars.compile(charttmpl);
    }, [schema])

    const content = React.useMemo(() => {
        hardReset()
        Handlebars.unregisterHelper('useColor')
        Handlebars.registerHelper('useColor', function (val: string) {
            return host.colorPalette.getColor(val).value
        })
        Handlebars.unregisterHelper('useSelection')
        Handlebars.registerHelper('useSelection', function (index: number) {
            if (table[index] && typeof index === 'number') {
                return `data-selection=true data-index="${index}"`
            }
        })
        Handlebars.unregisterHelper('useSelectionClear')
        Handlebars.registerHelper('useSelectionClear', function () {
            return `data-selection-clear="true"`
        })
        registerGlobal('table', table)
        try {
            return template({
                table,
                dataset,
                viewport
            })
        } catch (err) {
            return `<h4>${err.message}</h4><pre>${err.stack}</pre>`
        }
    }, [host, table, viewport, template])

    const draft = React.useRef<string>(schema);

    const onApplySchema = React.useCallback(() => {
        setSchema(draft.current);
    }, [setSchema]);

    console.log('content', content);

    return (
        <>
            {error ? (
                <>
                    <ErrorViewer error={error} height={height} width={width} json={content} />
                </>
            ) : (
                <>
                    <Layout style={{ height: '100%', background: 'transparent'}}>
                        <Sider width={width * (4/10)} style={{ background: colorBgContainer, overflowY: 'scroll' }}>
                            <Button style={{width: '100%', marginBottom: '10px'}} type="primary" onClick={() => {
                                setSchema(draft.current);
                                onSave(draft.current);
                            }}>
                                Save
                            </Button>
                            <Flex vertical={false}>
                                <Button className="apply" onClick={onApplySchema}>Apply</Button>
                                <a className="docs-link" onClick={(e) => host.launchUrl('https://ilfat-galiev.im/docs/apexcharts-visual/')}>Documentation</a>
                            </Flex>
                            <h4>Configuration</h4>
                            <AceEditor
                                width="100%"
                                height={`${height * (9/10)}px`}
                                mode="json"
                                theme="github"
                                onChange={(edit) => {
                                    draft.current = edit;
                                }}
                                setOptions={{
                                    useWorker: false
                                }}
                                value={schema}
                                name="CONFIGURATION_ID"
                                editorProps={{ $blockScrolling: true }}
                            />
                        </Sider>
                        <Layout style={{ padding: '0 0 15px 0', overflowY: 'auto', background: 'transparent' }}>
                            <Content
                                style={{
                                    padding: 24,
                                    margin: 0,
                                    minHeight: 280,
                                    background: colorBgContainer,
                                }}
                            >
                                <h4>Preview</h4>
                                <ErrorBoundary content={content} height={height} width={width} >
                                    <Viewer
                                        onClick={onClick}
                                        onContextMenu={onContextMenu}
                                        onHover={onHover}
                                        onHoverEnd={onHoverEnd}
                                        onResetSelection={onResetSelection} 
                                        table={dataset}
                                        height={height * (9/10)}
                                        width={width - (width * (4/10)) - 100}
                                        chartJSON={content}
                                    />
                                </ErrorBoundary>
                            </Content>
                        </Layout>
                    </Layout>
                </>
            )}

        </>
    );
};
