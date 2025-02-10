import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost;
import DataViewMetadataColumn = powerbiVisualsApi.DataViewMetadataColumn;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

import dompurify from "dompurify";
import type { Config as DompurifyConfig} from "dompurify";
import { utcParse } from "d3-time-format";
import JSON5 from 'json5'
import { ApexOptions } from "apexcharts";

export type Column = Pick<DataViewMetadataColumn, "displayName" | "index">;

export interface Row {
    [key: string]: PrimitiveValue | ISelectionId
    selection?: ISelectionId
}

export interface Table {
    rows: Row[];
    columns: Column[];
    column(name: string): PrimitiveValue[];
}

export const defaultDompurifyConfig = <DompurifyConfig>{
    SANITIZE_DOM: true,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_TAGS: ['b', 'sup', 'sub', 'br', 'i'],
    ALLOWED_ATTR: []
};

export function sanitizeHTML(dirty: string) {
    return dompurify.sanitize(dirty, defaultDompurifyConfig) as string;
}

/** uncoments block and line  comments of string of code */
export function uncommentCodeComments(code: string): string {
    // Uncomment block comments (/* ... */)
    code = code.replace(/\/\*\sHBT([\s\S]*?)\*\//gm, '$1');

    // Uncomment line comments (// ...)
    code = code.replace(/\/\/\sHBT\s(.*)/g, '$1');

    return code;
}

export function replaceNewline(str: string): string {
    return str.replace(/\\n/g, '\n');
}

export function safeParse(echartJson: string): any {
    let chart: any = {
        options: {},
        series: []
    };

    try {
        chart = echartJson ? JSON5.parse(echartJson) : {};
    } catch(e) {
        console.log(e.message);
    }

    return chart;
}

export function getChartColumns(echartJson: string): string[] {
    if (!echartJson) {
        return [];
    }
    const chart = safeParse(echartJson);

    if (chart.dataset) {
        if (chart.dataset.dimensions && chart.dataset.dimensions instanceof Array) {
            const columns = [];
            chart.dataset.dimensions.forEach((dimension: string | Record<string, string>) => {
                if (typeof dimension === 'string') {
                    columns.push(dimension);
                } else {
                    columns.push(dimension.name);
                }
            });

            return columns;
        }
        if (chart.dataset && chart.dataset.source && chart.dataset.source[0]) {
            return chart.dataset.source[0];
        }
    }

    return [];
}

export function convertData(dataView: DataView, host?: IVisualHost): Table {
    const table: Table = {
        rows: [],
        columns: [],
        column(name: string) {
            return this.rows.map(row => row[name]);
        }
    };

    if (!dataView || !dataView.table) {
        return table
    }

    const dateParse = utcParse('%Y-%m-%dT%H:%M:%S.%LZ');
    dataView.table.rows.forEach((data, rowIndex) => {
        const selection = host
            ?.createSelectionIdBuilder()
            .withTable(dataView.table, rowIndex)
            .createSelectionId();
        
        const row = {
            selection
        };
        dataView.table.columns.forEach((col, index) => {
            if (col.type.dateTime || col.type.temporal) {
                row[col.displayName] = dateParse(data[index] as string);
            } else {
                row[col.displayName] = data[index];
            }
        })

        table.rows.push(row)
    })

    table.columns = dataView.table.columns.map(c => ({
        displayName: c.displayName,
        index: c.index
    }))

    return table;
}

export function walk(
    key: string,
    tree: Record<string, unknown | unknown[]> | unknown,
    apply: (key: string, value: any, parent: Record<string, any>, tail: string) => void,
    tail: string = null) {
    if (typeof tree !== 'object') {
        apply(key, tree, null, tail);
        return;
    }
    for (const key in tree) {
        if (tree[key] instanceof Array) {
            const array = tree[key] as Array<unknown>;
            array.forEach((el, index) => {
                apply(index.toString(), el, array, tail);
                walk(index.toString(), el, apply, tail + `[${index}]` + '.' + key);
            });
        } else {
            apply(key, tree[key], tree, tail);
            if (tree[key] instanceof Object) {
                walk(key, tree[key], apply, tail + '.' + key);
            }
        }
        
    }
}

export function applyData(chart: {
    series?: ApexOptions["series"];
    options?: ApexOptions;
}, table: Table): void {
    if (!chart.options) {
        chart.options = {};
    }
    if (!chart.series) {
        chart.series = [];
    }
    walk(null, chart, (key: string, value: any, parent: Record<string, any>) => {
        if (key.endsWith('src')) {
            const datakey = key.slice(0, key.length-3);
            parent[datakey] = table.column(parent[key]);
        }
    });
}

export function applyMapping(echartJson: string | undefined, mapping: Record<string, string>, dataset: any) : string {
    const echart = safeParse(echartJson);
    
    if (echartJson && echartJson !== "{}") {
        walk(null, echart, (key: string, value: any, parent: Record<string, any>, tail: string) => {
            if (key === 'encode') {
                Object.keys(value).forEach(attr => {
                    value[attr] = mapping[attr];
                });
            }
            if (key.endsWith('src')) {
                const index = dataset.dimensions.indexOf(mapping[tail + "." + key]);
                const vector = (<any[]>dataset.source).map(row => row[index]);
                parent['value'] = vector;
                parent[key] = mapping[tail + "." + key];
            }
        }, "options")
    }
    echart.dataset = {
        dimensions: dataset.dimensions
    };

    return JSON5.stringify(echart);
}

export function verifyColumns(echartJson: string | undefined, chartColumns: string[], visualColumns: powerbiVisualsApi.DataViewMetadataColumn[]) : Record<string, string>[] {
    // TODO walk through tree to find encode
    const unmappedColumns = [];
    if (echartJson && echartJson !== "{}") {
        echartJson = safeParse(echartJson);
        walk(null, echartJson, (key: string, value: any, parent: any, tail: string) => {
            if (key === 'encode') {
                Object.keys(value).forEach(attr => {
                    const columnMapped = visualColumns.find(vc => vc.displayName === value[attr]);
                    if (!columnMapped) {
                        unmappedColumns.push({[attr]: value[attr]});
                    }
                });
            }
            if (key && typeof key == 'string' && key.endsWith('src')) {
                const columnMapped = visualColumns.find(vc => vc.displayName === value);
                if (!columnMapped) {
                    unmappedColumns.push({[tail + "." + key]: value});
                }
            }
        }, "options")
    } else {
        // chartColumns.filter(ch => visualColumns.find(vc => vc.displayName === ch) === undefined);
        // old mapping 
    }
    return unmappedColumns;
}
