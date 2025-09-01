import React from 'react';
import { Table } from 'antd';

const TestTable = () => {
    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Age', dataIndex: 'age', key: 'age' },
    ];

    const data = [
        { key: '1', name: 'John', age: 32 },
        { key: '2', name: 'Jane', age: 28 },
    ];

    return <Table columns={columns} dataSource={data} />;
};

export default TestTable;