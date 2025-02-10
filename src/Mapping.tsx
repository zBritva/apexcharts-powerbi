import React from "react";

import powerbiApi from "powerbi-visuals-api";
import DataView = powerbiApi.DataView;
import Dropdown from "antd/es/dropdown";
import Button from "antd/es/button";
import Space from "antd/es/space";
import { DownOutlined } from '@ant-design/icons';
import { Layout, Table } from "antd";

export interface MappingProps {
    table: any;
    dataView: DataView;
    unmappedColumns: Record<string, string>[];
    onSaveMapping: (value: Record<string, string>) => void;
}

/* eslint-disable max-lines-per-function */
export const Mapping: React.FC<MappingProps> = ({ unmappedColumns, dataView, onSaveMapping }) => {
    const [mapping, setMapping] = React.useState<Record<string, string>>({});

    const rows = unmappedColumns.flatMap(column => {

        const unmappedAttributes = Object.keys(column);

        return unmappedAttributes.map(attr => {
            return {
                chartColumn: attr,
                dataColumn: mapping[attr]
            }
        });
    });

    const columns = [
        {
            title: 'Chart columns',
            key: 'chartColumn',
            dataIndex: 'chartColumn',
        },
        {
            title: 'Visual data view column',
            key: 'dataColumn',
            dataIndex: 'dataColumn',
            render: (text, record) => {
                return (
                    <Dropdown menu={{
                            items: dataView.metadata.columns.map(col => ({
                                label: col.displayName,
                                key: col.queryName,
                                onClick: () => {
                                    mapping[record.chartColumn] = col.displayName;
                                    setMapping({...mapping});
                                }
                            }))
                        }} trigger={['click']} >
                        <Button>
                            <Space>
                                {mapping[record.chartColumn]}
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                )
            },
        }
    ];

    return (
        <>
            <Layout style={{padding: '5px', background: 'transparent'}}>
                <Table
                    pagination={false}
                    columns={columns}
                    dataSource={rows}
                />
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
                    <Button style={{
                        margin: '10px'
                    }} onClick={() => {
                        onSaveMapping(mapping);
                    }}>
                        Apply
                    </Button>
                </div>
            </Layout>
        </>
    );
};
