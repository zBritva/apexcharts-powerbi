import React from 'react';

import powerbiApi from "powerbi-visuals-api";

import { Viewer } from './View';
import { Tutorial } from './Tutorial';
import { Mapping } from './Mapping';
import { QuickChart } from './QuickChart';

import Handlebars from "handlebars";
import JSON5 from 'json5'

import { useAppSelector, useAppDispatch } from './redux/hooks';
import { setSettings } from './redux/slice';
import { IVisualSettings } from './settings';
import { applyMapping, uncommentCodeComments } from './utils';

import { hardReset, registerGlobal } from "./handlebars/helpers"
import { sanitizeHTML } from './utils'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationProps {
}

/* eslint-disable max-lines-per-function */
export const Application: React.FC<ApplicationProps> = () => {

    const settings = useAppSelector((state) => state.options.settings);
    const option = useAppSelector((state) => state.options.options);
    const host = useAppSelector((state) => state.options.host);
    const selectionManager = useAppSelector((state) => state.options.selectionManager);

    const dataView = useAppSelector((state) => state.options.dataView);
    const viewport = useAppSelector((state) => state.options.viewport);
    
    const unmappedColumns = useAppSelector((state) => state.options.unmappedColumns);
    const table = useAppSelector((state) => state.options.table);

    const chart = useAppSelector((state) => state.options.settings.chart.apexcharts);
    
    const dispatch = useAppDispatch();

    const persistProperty = React.useCallback((json_string: string) => {
        const instance: powerbiApi.VisualObjectInstance = {
            objectName: "chart",
            selector: undefined,
            properties: {
                apexcharts: json_string
            }
        };

        host.persistProperties({
            replace: [
                instance
            ]
        });
    }, [host])

    const template = React.useMemo(() => {
        const charttmpl = uncommentCodeComments(chart);
        return Handlebars.compile(charttmpl);
    }, [chart])

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
                viewport
            })
        } catch (err) {
            return `<h4>${err.message}</h4><pre>${err.stack}</pre>`
        }
    }, [host, table, viewport, template])

    const onClickHandler = React.useCallback((event, chartContext, config) => {
        if (!table.rows[config.dataPointIndex]){
            return
        } 
        else if (event.button == 2) {
            selectionManager.showContextMenu(
                table.rows[config.dataPointIndex].selection,
                {
                    x: event.clientX,
                    y: event.clientY    
                });
        } else {
            selectionManager.select(table.rows[config.dataPointIndex].selection, event.ctrlKey || event.metaKey)
        }
        event.stopPropagation();
        event.preventDefault();
    },[table, selectionManager]);

    const onResetSelectionHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        selectionManager.clear();
        event.stopPropagation();
        event.preventDefault();
    },[table, selectionManager]);

    const onContextMenuHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        selectionManager.showContextMenu(null, {
            x: event.clientX,
            y: event.clientY    
        });
        event.stopPropagation();
        event.preventDefault();
    }, []);

    const onHoverHandler = React.useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, chartContext, config) => {
        console.log(event);
    }, []);

    const onHoverEndHandler = React.useCallback((event, chartContext, config) => {
        host.tooltipService.hide({
            immediately: true,
            isTouchEvent: false
        })
    }, [host]);

    if (!option || !settings) {
        return (<h1>Loading...</h1>)
    }

    if (option.editMode === powerbiApi.EditMode.Advanced ||
        (content === '{}' && dataView && table)) {
        return (
            <QuickChart
                table={table}
                height={option.viewport.height}
                width={option.viewport.width}
                dataView={dataView}
                current={chart}
                onSave={(json) => {
                    persistProperty(json);
                    const newSettings: IVisualSettings = JSON5.parse(JSON5.stringify(settings));
                    newSettings.chart.apexcharts = json;
                    dispatch(setSettings(newSettings));
                }}
                onResetSelection={onResetSelectionHandler}
                onContextMenu={onContextMenuHandler}
            />
        );
    }

    if (option && unmappedColumns.length) {
        return (
            <Mapping
                dataView={dataView}
                table={table}
                unmappedColumns={unmappedColumns}
                onSaveMapping={(mapping) => {
                    const mappedJSON = applyMapping(settings.chart.apexcharts, mapping, table);
                    const newSettings: IVisualSettings = JSON5.parse(JSON5.stringify(settings));
                    newSettings.chart.apexcharts = mappedJSON;
                    dispatch(setSettings(newSettings));
                    persistProperty(mappedJSON);
                }}
            />
        )
    }

    if (!dataView || !dataView.categorical) {
        const categorical = dataView?.categorical;
        if (!dataView && !categorical || settings && settings.chart.apexcharts === '{}') {
            return (
                <Tutorial
                    height={option.viewport.height}
                    width={option.viewport.width}
                    dataset={table}
                />
            )
        }

        if (settings) {
            return (
                <>
                    <Viewer
                        table={table}
                        height={option.viewport.height}
                        width={option.viewport.width}
                        chartJSON={content}
                        onClick={onClickHandler}
                        onHover={onHoverHandler}
                        onHoverEnd={onHoverEndHandler}
                        onResetSelection={onResetSelectionHandler}
                        onContextMenu={onContextMenuHandler}
                    />
                </>
            );
        }
    }
}
