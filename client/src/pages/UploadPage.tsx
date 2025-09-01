import React, { useState, useEffect } from 'react';
import { Card, Form, Upload, Input, Checkbox, Button, Progress, Alert, message, Space, List, Table } from 'antd';
import { UploadOutlined, InboxOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

interface UploadResult {
    success: boolean;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors?: Array<{ batch: string; error: string }>;
    preview?: Array<any>;
}

const UploadPage: React.FC = () => {
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [progressRows, setProgressRows] = useState({ current: 0, total: 0 });
    const [result, setResult] = useState<UploadResult | null>(null);
    const [fileList, setFileList] = useState<any[]>([]);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        if (uploading) {
            eventSource = new EventSource(`${API_URL}/upload-progress`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.current && data.total) {
                    const percent = Math.round((data.current / data.total) * 100);
                    setProgress(percent);
                    setProgressRows({ current: data.current, total: data.total });
                }

                if (data.message) {
                    setProgressMessage(data.message);
                }
            };

            eventSource.onerror = () => {
                eventSource?.close();
            };
        }

        return () => {
            eventSource?.close();
        };
    }, [uploading]);

    const handleUpload = async (values: any) => {
        if (fileList.length === 0) {
            message.error('Please select a file to upload');
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', fileList[0]);
        formData.append('sheetName', values.sheetName || '');
        formData.append('clearTable', values.clearTable ? 'true' : 'false');

        setUploading(true);
        setProgress(0);
        setResult(null);
        setProgressMessage('Initializing...');

        try {
            const response = await axios.post(`${API_URL}/upload-items`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setResult(response.data);
                message.success('Upload completed successfully!');
            } else {
                throw new Error(response.data.error || 'Upload failed');
            }
        } catch (error: any) {
            message.error(error.message || 'Failed to upload file');
            setResult({
                success: false,
                totalRows: 0,
                successfulRows: 0,
                failedRows: 0,
                errors: [{ batch: 'Upload', error: error.message }],
            });
        } finally {
            setUploading(false);
            setFileList([]);
            form.resetFields();
        }
    };

    const uploadProps: UploadProps = {
        accept: '.xlsx,.xls',
        maxCount: 1,
        beforeUpload: (file) => {
            setFileList([file]);
            return false; // Prevent automatic upload
        },
        onRemove: () => {
            setFileList([]);
        },
        fileList,
    };

    const previewColumns = [
        { title: 'ID', dataIndex: 'ID', key: 'ID', width: 80 },
        { title: 'Item #', dataIndex: 'Item #', key: 'Item #' },
        { title: 'Vendor', dataIndex: 'Vendor Name', key: 'Vendor Name' },
        { title: 'Brand', dataIndex: 'Brand Name', key: 'Brand Name' },
        { title: 'Description', dataIndex: 'Description1', key: 'Description1', ellipsis: true },
        {
            title: 'FOB Cost',
            dataIndex: 'FOB Cost',
            key: 'FOB Cost',
            render: (value: number) => value ? `$${value.toFixed(2)}` : '-'
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card
                title="Upload Excel File to ItemVendorDetails"
                variant="borderless"
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpload}
                    disabled={uploading}
                >
                    <Form.Item
                        label="Select Excel File (.xlsx, .xls)"
                        rules={[{ required: true, message: 'Please select a file' }]}
                    >
                        <Upload.Dragger {...uploadProps}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            </p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                            <p className="ant-upload-hint">
                                The Excel file should have data starting from row 2 (row 1 is headers)
                            </p>
                        </Upload.Dragger>
                    </Form.Item>

                    <Form.Item
                        name="sheetName"
                        label="Sheet Name (leave empty for first sheet)"
                    >
                        <Input placeholder="Optional: Specific sheet name" />
                    </Form.Item>

                    <Form.Item name="clearTable" valuePropName="checked">
                        <Checkbox>Clear existing data before upload</Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<UploadOutlined />}
                            loading={uploading}
                            size="large"
                            block
                        >
                            Upload and Import
                        </Button>
                    </Form.Item>
                </Form>

                {uploading && (
                    <div style={{ marginTop: 24 }}>
                        <Progress
                            percent={progress}
                            status="active"
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <span>{progressMessage}</span>
                            {progressRows.total > 0 && (
                                <span>{progressRows.current} / {progressRows.total} rows</span>
                            )}
                        </div>
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: 24 }}>
                        <h3>Upload Results</h3>
                        {result.success ? (
                            <Alert
                                message="Success!"
                                description={
                                    <div>
                                        <p>Processed {result.totalRows} rows</p>
                                        <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> {result.successfulRows} rows imported successfully</p>
                                        {result.failedRows > 0 && (
                                            <p><CloseCircleOutlined style={{ color: '#f5222d' }} /> {result.failedRows} rows failed</p>
                                        )}
                                    </div>
                                }
                                type="success"
                                showIcon
                            />
                        ) : (
                            <Alert
                                message="Upload Failed"
                                type="error"
                                showIcon
                            />
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <Alert
                                message="Errors encountered:"
                                description={
                                    <List
                                        size="small"
                                        dataSource={result.errors}
                                        renderItem={(error) => (
                                            <List.Item>
                                                <span style={{ color: '#f5222d' }}>
                                                    {error.batch}: {error.error}
                                                </span>
                                            </List.Item>
                                        )}
                                    />
                                }
                                type="warning"
                                style={{ marginTop: 16 }}
                            />
                        )}

                        {result.preview && result.preview.length > 0 && (
                            <Card
                                title="Last 5 imported rows"
                                size="small"
                                style={{ marginTop: 16 }}
                            >
                                <Table
                                    columns={previewColumns}
                                    dataSource={result.preview}
                                    rowKey="ID"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 800 }}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </Card>

            <Card
                title="Data Cleaning Rules"
                variant="borderless"
                style={{
                    borderRadius: 8,
                    borderLeft: '4px solid #1890ff',
                    backgroundColor: '#f0f8ff'
                }}
            >
                <List
                    size="small"
                    dataSource={[
                        'Fields with "X" or empty values in dimension columns will be converted to NULL',
                        'Percentage values in Current Duty and Current Tariff will be converted to decimals (15% ? 0.15)',
                        'Data is mapped by column position (A ? Item #, B ? Vendor Name, etc.)',
                    ]}
                    renderItem={(item) => (
                        <List.Item>
                            <span style={{ color: '#555' }}>{item}</span>
                        </List.Item>
                    )}
                />
            </Card>
        </Space>
    );
};

export default UploadPage;