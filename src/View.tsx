import React from "react";
import Chart from "react-apexcharts";

import { Table, applyData, safeParse } from "./utils";

export interface ViewerProps {
    width: number;
    height: number;
    chartJSON: any;
    table: Table;
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onHover?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onHoverEnd?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext: any, config: any) => void;
    onResetSelection?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

/* eslint-disable max-lines-per-function */
export const Viewer: React.FC<ViewerProps> = ({
    height, width, chartJSON, table,
    onClick, onHover, onResetSelection, onContextMenu
}) => {

    const json = safeParse(chartJSON);
    applyData(json, table);

    if (json && onClick) {
        if (!json.options.chart) {
            json.options.chart = {
                events: {}
            }
        }
        if (!json.options.chart.events) {
            json.options.chart.events = {}
        }
        json.options.chart.events.dataPointSelection = onClick 
    }

    if (json) {
        // const listener = () => {
        //     const canvas = document.querySelector('.apexcharts-tooltip')
        //     const lst = (event) => {
        //         event.stopPropagation();
        //         event.preventDefault();
        //     };
        //     canvas.addEventListener('contextmenu', lst);
        // }

        if (!json.options.chart) {
            json.options.chart = {
                events: {}
            }
        }
        if (!json.options.chart.events) {
            json.options.chart.events = {}
        }
        json.options.chart.events.dataPointMouseEnter = onHover
        
        json.options.chart.events.markerClick = (event) => {
            event.stopPropagation();
            event.preventDefault();
        } 
        if (!json.options.chart.toolbar) {
            json.options.chart.toolbar = {}
        }
        json.options.chart.toolbar.show = false;

        // json.options.chart.events.mounted = listener;
        // json.options.chart.events.updated = listener;
    }

    const container = React.useRef<HTMLDivElement>();

    return (
        <>
            <div
                ref={container}
                onContextMenu={onContextMenu}
                onClick={onResetSelection}
                style={{
                    backgroundColor: 'transparent',
                    width: width,
                    height: height,
                }}>
                <Chart
                    redrawOnParentResize={true}
                    options={json.options}
                    series={json.series}
                    type="bar"
                    width={width}
                    height={height}
                />
            </div>
        </>
    );
};
