import React from "react";

const addDataImage = require('../assets/add_data2.gif');
const openEditImage = require('../assets/open_edit.gif');


export interface TutorialProps {
    width: number;
    height: number;
    dataset: any;
}

/* eslint-disable max-lines-per-function */
export const Tutorial: React.FC<TutorialProps> = ({ height, width, dataset }) => {

    const mainDiv = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        return () => {
            // 
        };
    }, []);

    // handle resize
    React.useEffect(() => {
        // 
    }, [height, width]);

    return (
        <>
            <div
                ref={mainDiv}
            >
                <p>Tutorial</p>
                {
                    dataset.source instanceof Array && !dataset.source?.length ||
                    !(dataset.source instanceof Array) && !dataset.source
                    ? 
                    (
                        <>
                            <h2>Assign data to the visual</h2>
                            <img src={addDataImage}></img>
                        </>
                    )
                    : null
                }
                {
                    dataset.source instanceof Array && dataset.source?.length ||
                    dataset.source && !(dataset.source instanceof Array)
                    ? 
                    (
                        <>
                            <h2>Source ready, let's configure the chart</h2>
                            <img src={openEditImage}></img>
                        </>
                    )
                    : null
                }
            </div>
        </>
    );
};

