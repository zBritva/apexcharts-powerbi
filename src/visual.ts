"use strict";

import React from 'react';
import reactDom from 'react-dom';
import { Application } from './Application';

import "../style/visual.less";
import powerbiVisualsApi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbiVisualsApi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbiVisualsApi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbiVisualsApi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbiVisualsApi.VisualObjectInstance;
import DataView = powerbiVisualsApi.DataView;
import VisualObjectInstanceEnumerationObject = powerbiVisualsApi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbiVisualsApi.extensibility.visual.IVisualHost

import { VisualSettings } from "./settings";

import { Provider } from 'react-redux';
import { store } from "./redux/store";
import { setHost, setOptions, setSettings, setViewport } from './redux/slice';


export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: IVisualHost;

    private fetchIsDone: boolean = false; 

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;

        window.open = (url?: string | URL) => {
            if (typeof url === "string") {
                this.host.launchUrl(url);
            }
            return window;
        };

        store.dispatch(setHost(options.host));

        if (document) {
            const reactApplication = React.createElement(Application, {
                key: "root",
            });
            const provider = React.createElement(Provider, {
                store: store,
                key: 'provider',
                children: []
            }, [
                reactApplication
            ])
            reactDom.render(provider, this.target);
        }
    }

    public update(options: VisualUpdateOptions) {
        const dataView = options && options.dataViews && options.dataViews[0];
        this.settings = Visual.parseSettings(dataView);
        store.dispatch(setViewport(options.viewport));
        store.dispatch(setSettings(this.settings));
        store.dispatch(setOptions(options)); //TODO deep copy
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        if (options.objectName === 'chart') {
            return <VisualObjectInstance[]>[
                {
                    objectName: options.objectName,
                    properties: {}
                }
            ];
        }
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}