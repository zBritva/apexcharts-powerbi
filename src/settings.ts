
"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export interface IVisualSettings {
    chart: Chart;
}

export class VisualSettings extends DataViewObjectsParser implements IVisualSettings {
    public chart: Chart = new Chart();
}

export class Chart {
    public apexcharts: string = '{\n\t"options":{},\n"series":[],}';
}
