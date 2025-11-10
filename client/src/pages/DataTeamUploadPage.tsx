import React, { useState } from 'react';
import { Card, Upload, Button, Steps, Table, Tag, Space, Alert, App, Tooltip, Progress, List, Badge } from 'antd';
import { UploadOutlined, CheckCircleOutlined, SyncOutlined, ExclamationCircleOutlined, CloseCircleOutlined, InboxOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const { Step } = Steps;

interface ValidationError {
    row: number;
    field?: string;
    itemCode?: string;
    column?: string;
    upcCode?: string;
    gtinCode?: string;
    length?: number;
    message?: string;
}

interface ComparisonRecord {
    change_type: string;
    id: number;
    item_code: string;
    brand_name: string;
    description1: string;
    field_name: string;
    current_value: string;
    new_value: string;
}

// Helper function to detect whitespace issues
const detectWhitespaceIssue = (text: string): { hasLeading: boolean; hasTrailing: boolean; length: number; trimmedLength: number } => {
    if (!text) return { hasLeading: false, hasTrailing: false, length: 0, trimmedLength: 0 };
    return {
        hasLeading: text.length > 0 && text[0] === ' ',
        hasTrailing: text.length > 0 && text[text.length - 1] === ' ',
        length: text.length,
        trimmedLength: text.trim().length
    };
};

// Helper function to visualize whitespace
const visualizeWhitespace = (text: string): string => {
    if (!text) return text;
    return text
        .replace(/^ +/, (match) => `⎵`.repeat(match.length)) // Leading spaces
        .replace(/ +$/, (match) => `⎵`.repeat(match.length)) // Trailing spaces
        .replace(/\t/g, '→'); // Tabs
};

const DataTeamUploadPage: React.FC = () => {
    const { modal, message } = App.useApp();
    const [currentStep, setCurrentStep] = useState(0);
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any>(null);
    const [validatedData, setValidatedData] = useState<any[]>([]);
    const [differences, setDifferences] = useState<ComparisonRecord[]>([]);
    const [selectedChanges, setSelectedChanges] = useState<string[]>([]);

    // Progress tracking
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [uploadResult, setUploadResult] = useState<any>(null);

    const handleFileChange = ({ fileList: newFileList }: any) => {
        setFileList(newFileList.slice(-1)); // Keep only the last file
    };

    const validateFile = async () => {
        if (fileList.length === 0) {
            message.error('Please select a file to upload');
            return;
        }

        // First, check if temp table has data
        try {
            const checkResponse = await axios.get(`${API_CONFIG.BASE_URL}/check-data-team-temp`);

            if (checkResponse.data.success && checkResponse.data.hasData) {
                // Show confirmation modal
                modal.confirm({
                    title: 'Temp Table Has Existing Data',
                    content: `The temporary table contains ${checkResponse.data.count} row(s). All existing data will be deleted before uploading the new file. Do you want to proceed?`,
                    okText: 'Yes, Delete and Upload',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: async () => {
                        await proceedWithValidation();
                    }
                });
            } else {
                // No data in temp table, proceed directly
                await proceedWithValidation();
            }
        } catch (error: any) {
            console.error('Error checking temp table:', error);
            message.error('Failed to check temp table status');
        }
    };

    const proceedWithValidation = async () => {
        setLoading(true);
        setProgress(0);
        setProgressMessage('Validating Excel file...');
        setUploadResult(null);

        const formData = new FormData();
        formData.append('excelFile', fileList[0].originFileObj as File);

        // Simulate progress during validation
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/validate-data-team-excel`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            clearInterval(progressInterval);
            setProgress(100);
            setProgressMessage('Validation complete!');

            if (response.data.success) {
                message.success('File validated successfully!');
                setValidatedData(response.data.data);
                setUploadResult({
                    success: true,
                    totalRows: response.data.data.length,
                    validRows: response.data.data.length,
                });
                setCurrentStep(1);
                await uploadToTemp(response.data.data);
            } else {
                setValidationErrors(response.data.errors);
                setUploadResult({
                    success: false,
                    errors: response.data.errors,
                });
                message.error('Validation failed - please review the errors below');
            }
        } catch (error: any) {
            clearInterval(progressInterval);
            setProgress(0);
            console.error('Validation error:', error);
            message.error(error.response?.data?.error || 'Failed to validate file');
            setUploadResult({
                success: false,
                error: error.response?.data?.error || 'Failed to validate file',
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadToTemp = async (data: any[]) => {
        setLoading(true);
        setProgress(0);
        setProgressMessage('Importing data to temp table...');
        console.log('uploadToTemp called with data length:', data.length);

        // Simulate progress during import
        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 15, 90));
        }, 300);

        try {
            console.log('Sending data to import-data-team-temp endpoint...');
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/import-data-team-temp`,
                { data, clearTable: true }
            );

            clearInterval(progressInterval);
            setProgress(100);
            setProgressMessage('Import complete!');

            console.log('Import response:', response.data);
            if (response.data.success) {
                message.success(`Data uploaded to temp table: ${response.data.totalRows} rows`);
                setUploadResult(prev => ({
                    ...prev,
                    importedRows: response.data.totalRows,
                }));
                setCurrentStep(2);
                await fetchComparison();
            } else {
                console.error('Import failed:', response.data);
                message.error('Failed to upload data to temp table');
            }
        } catch (error: any) {
            clearInterval(progressInterval);
            setProgress(0);
            console.error('Upload error:', error);
            console.error('Error response:', error.response?.data);
            message.error(error.response?.data?.error || 'Failed to upload to temp table');
        } finally {
            setLoading(false);
        }
    };

    const fetchComparison = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/compare-data-team`);

            if (response.data.success) {
                setDifferences(response.data.differences);
                message.info(`Found ${response.data.differences.length} differences`);
            } else {
                message.error('Failed to fetch comparison data');
            }
        } catch (error: any) {
            console.error('Comparison error:', error);
            message.error(error.response?.data?.error || 'Failed to compare data');
        } finally {
            setLoading(false);
        }
    };

    const applyChanges = async (applyAll: boolean = false) => {
        const changesToApply = applyAll
            ? differences.map(record => `${record.change_type}|||${record.item_code}|||${record.field_name}`)
            : selectedChanges;

        if (changesToApply.length === 0) {
            message.warning('Please select changes to apply');
            return;
        }

        // Show confirmation for applying all changes
        if (applyAll) {
            modal.confirm({
                title: 'Apply All Changes?',
                content: `This will apply all ${changesToApply.length} changes to the main table. Are you sure you want to proceed?`,
                okText: 'Yes, Apply All',
                okType: 'primary',
                cancelText: 'Cancel',
                onOk: async () => {
                    await performApplyChanges(changesToApply);
                }
            });
        } else {
            await performApplyChanges(changesToApply);
        }
    };

    const performApplyChanges = async (changeIds: string[]) => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_CONFIG.BASE_URL}/apply-data-team-changes`,
                { changeIds }
            );

            if (response.data.success) {
                message.success(`Successfully applied ${response.data.appliedCount} changes`);
                setCurrentStep(3);
                setSelectedChanges([]);
                setDifferences([]);
            } else {
                message.error('Failed to apply changes');
            }
        } catch (error: any) {
            console.error('Apply changes error:', error);
            message.error(error.response?.data?.error || 'Failed to apply changes');
        } finally {
            setLoading(false);
        }
    };

    const resetUpload = () => {
        setCurrentStep(0);
        setFileList([]);
        setValidatedData([]);
        setDifferences([]);
        setSelectedChanges([]);
        setValidationErrors(null);
        setProgress(0);
        setProgressMessage('');
        setUploadResult(null);
    };

    const comparisonColumns = [
        {
            title: 'Change Type',
            dataIndex: 'change_type',
            key: 'change_type',
            width: 120,
            fixed: 'left' as const,
            render: (type: string) => {
                const color = type === 'NEW' ? 'green' : type === 'MODIFIED' ? 'blue' : 'red';
                return <Tag color={color}>{type}</Tag>;
            },
        },
        {
            title: 'Item Code',
            dataIndex: 'item_code',
            key: 'item_code',
            width: 120,
            fixed: 'left' as const,
        },
        {
            title: 'Brand',
            dataIndex: 'brand_name',
            key: 'brand_name',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    {text}
                </Tooltip>
            ),
        },
        {
            title: 'Field',
            dataIndex: 'field_name',
            key: 'field_name',
            width: 150,
        },
        {
            title: 'Current Value',
            dataIndex: 'current_value',
            key: 'current_value',
            width: 350,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string, record: ComparisonRecord) => {
                const wsInfo = detectWhitespaceIssue(text);
                const hasWhitespaceIssue = wsInfo.hasLeading || wsInfo.hasTrailing;
                const visualizedText = hasWhitespaceIssue ? visualizeWhitespace(text) : text;

                return (
                    <div>
                        <Tooltip
                            placement="topLeft"
                            title={
                                <div>
                                    <div>Original: {text}</div>
                                    {hasWhitespaceIssue && (
                                        <>
                                            <div>Length: {wsInfo.length} chars</div>
                                            <div>Trimmed: {wsInfo.trimmedLength} chars</div>
                                            {wsInfo.hasLeading && <div style={{ color: '#faad14' }}>⚠ Has leading spaces</div>}
                                            {wsInfo.hasTrailing && <div style={{ color: '#faad14' }}>⚠ Has trailing spaces</div>}
                                        </>
                                    )}
                                </div>
                            }
                            overlayStyle={{ maxWidth: '500px' }}
                        >
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '100px',
                                overflow: 'auto',
                                position: 'relative'
                            }}>
                                {hasWhitespaceIssue && (
                                    <InfoCircleOutlined
                                        style={{
                                            color: '#faad14',
                                            marginRight: 4,
                                            fontSize: '12px'
                                        }}
                                    />
                                )}
                                <span style={{ fontFamily: hasWhitespaceIssue ? 'monospace' : 'inherit' }}>
                                    {visualizedText}
                                </span>
                                {hasWhitespaceIssue && (
                                    <Badge
                                        count={wsInfo.length}
                                        style={{
                                            backgroundColor: '#faad14',
                                            marginLeft: 8,
                                            fontSize: '10px'
                                        }}
                                        title="Character count with whitespace"
                                    />
                                )}
                            </div>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: 'New Value',
            dataIndex: 'new_value',
            key: 'new_value',
            width: 350,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string, record: ComparisonRecord) => {
                const wsInfo = detectWhitespaceIssue(text);
                const hasWhitespaceIssue = wsInfo.hasLeading || wsInfo.hasTrailing;
                const visualizedText = hasWhitespaceIssue ? visualizeWhitespace(text) : text;

                return (
                    <div>
                        <Tooltip
                            placement="topLeft"
                            title={
                                <div>
                                    <div>New value: {text}</div>
                                    {hasWhitespaceIssue && (
                                        <>
                                            <div>Length: {wsInfo.length} chars</div>
                                            <div>Trimmed: {wsInfo.trimmedLength} chars</div>
                                            {wsInfo.hasLeading && <div style={{ color: '#faad14' }}>⚠ Has leading spaces</div>}
                                            {wsInfo.hasTrailing && <div style={{ color: '#faad14' }}>⚠ Has trailing spaces</div>}
                                        </>
                                    )}
                                </div>
                            }
                            overlayStyle={{ maxWidth: '500px' }}
                        >
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '100px',
                                overflow: 'auto',
                                backgroundColor: record.change_type === 'MODIFIED' ? '#e6f7ff' : 'transparent',
                                padding: hasWhitespaceIssue ? '4px' : '0'
                            }}>
                                {hasWhitespaceIssue && (
                                    <InfoCircleOutlined
                                        style={{
                                            color: '#faad14',
                                            marginRight: 4,
                                            fontSize: '12px'
                                        }}
                                    />
                                )}
                                <span style={{ fontFamily: hasWhitespaceIssue ? 'monospace' : 'inherit' }}>
                                    {visualizedText}
                                </span>
                                {hasWhitespaceIssue && (
                                    <Badge
                                        count={wsInfo.length}
                                        style={{
                                            backgroundColor: '#faad14',
                                            marginLeft: 8,
                                            fontSize: '10px'
                                        }}
                                        title="Character count with whitespace"
                                    />
                                )}
                            </div>
                        </Tooltip>
                    </div>
                );
            },
        },
    ];

    const newRecordsCount = differences.filter(d => d.change_type === 'NEW').length;
    const modifiedRecordsCount = differences.filter(d => d.change_type === 'MODIFIED').length;
    const deletedRecordsCount = differences.filter(d => d.change_type === 'DELETED').length;

    return (
        <div className="page-container">
            <Card title="Upload Data Team Items">
                <Steps current={currentStep} style={{ marginBottom: 32 }}>
                    <Step title="Upload File" icon={<UploadOutlined />} />
                    <Step title="Validate & Import" icon={<SyncOutlined />} />
                    <Step title="Review Changes" icon={<ExclamationCircleOutlined />} />
                    <Step title="Complete" icon={<CheckCircleOutlined />} />
                </Steps>

                {currentStep === 0 && (
                    <>
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Upload.Dragger
                                fileList={fileList}
                                onChange={handleFileChange}
                                beforeUpload={() => false}
                                accept=".xlsx,.xls"
                                maxCount={1}
                                disabled={loading}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined style={{ fontSize: 48, color: '#043168' }} />
                                </p>
                                <p className="ant-upload-text">Click or drag Excel file to this area to upload</p>
                                <p className="ant-upload-hint">
                                    Excel file will be validated for duplicates and required fields
                                </p>
                            </Upload.Dragger>
                            <div style={{ marginTop: 32 }}>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={validateFile}
                                    loading={loading}
                                    disabled={fileList.length === 0}
                                    icon={<UploadOutlined />}
                                    block
                                >
                                    Validate & Upload
                                </Button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {loading && (
                            <div style={{ marginTop: 24 }}>
                                <Progress
                                    percent={progress}
                                    status="active"
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                    <span>{progressMessage}</span>
                                </div>
                            </div>
                        )}

                        {/* Upload Results */}
                        {uploadResult && !loading && (
                            <div style={{ marginTop: 24 }}>
                                {uploadResult.success ? (
                                    <Alert
                                        message="Validation Successful!"
                                        description={
                                            <div>
                                                <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> Total rows validated: {uploadResult.totalRows}</p>
                                                <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> Valid rows: {uploadResult.validRows}</p>
                                                {uploadResult.importedRows && (
                                                    <p><CheckCircleOutlined style={{ color: '#52c41a' }} /> Rows imported to temp table: {uploadResult.importedRows}</p>
                                                )}
                                            </div>
                                        }
                                        type="success"
                                        showIcon
                                    />
                                ) : (
                                    <Alert
                                        message="Validation Failed"
                                        description={uploadResult.error || 'Please fix the errors below and try again'}
                                        type="error"
                                        showIcon
                                    />
                                )}
                            </div>
                        )}

                        {/* Validation Errors Display */}
                        {validationErrors && (
                            <div style={{ marginTop: 24 }}>
                                <Alert
                                    message="Validation Errors Found"
                                    description="Please fix the following errors in your Excel file and try again."
                                    type="error"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />

                                {/* Duplicate Item Codes */}
                                {validationErrors.duplicateItems?.length > 0 && (
                                    <Card title={`Duplicate Item Codes (${validationErrors.duplicateItems.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.duplicateItems}
                                            rowKey={(record: any, index: number) => `dup-item-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode' }
                                            ]}
                                        />
                                    </Card>
                                )}

                                {/* Duplicate UPCs */}
                                {validationErrors.duplicateUPCs?.length > 0 && (
                                    <Card title={`Duplicate UPCs (${validationErrors.duplicateUPCs.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.duplicateUPCs}
                                            rowKey={(record: any, index: number) => `dup-upc-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Column', dataIndex: 'column', key: 'column', width: 120 },
                                                { title: 'UPC Code', dataIndex: 'upcCode', key: 'upcCode' }
                                            ]}
                                        />
                                    </Card>
                                )}

                                {/* Invalid UPCs */}
                                {validationErrors.invalidUPCs?.length > 0 && (
                                    <Card title={`Invalid UPCs (${validationErrors.invalidUPCs.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.invalidUPCs}
                                            rowKey={(record: any, index: number) => `inv-upc-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Column', dataIndex: 'column', key: 'column', width: 120 },
                                                { title: 'UPC Code', dataIndex: 'upcCode', key: 'upcCode' },
                                                { title: 'Length', dataIndex: 'length', key: 'length', width: 80 }
                                            ]}
                                        />
                                    </Card>
                                )}

                                {/* Duplicate GTINs */}
                                {validationErrors.duplicateGTINs?.length > 0 && (
                                    <Card title={`Duplicate GTINs (${validationErrors.duplicateGTINs.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.duplicateGTINs}
                                            rowKey={(record: any, index: number) => `dup-gtin-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Column', dataIndex: 'column', key: 'column', width: 120 },
                                                { title: 'GTIN Code', dataIndex: 'gtinCode', key: 'gtinCode' }
                                            ]}
                                        />
                                    </Card>
                                )}

                                {/* Invalid GTINs */}
                                {validationErrors.invalidGTINs?.length > 0 && (
                                    <Card title={`Invalid GTINs (${validationErrors.invalidGTINs.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.invalidGTINs}
                                            rowKey={(record: any, index: number) => `inv-gtin-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Column', dataIndex: 'column', key: 'column', width: 120 },
                                                { title: 'GTIN Code', dataIndex: 'gtinCode', key: 'gtinCode' },
                                                { title: 'Length', dataIndex: 'length', key: 'length', width: 80 },
                                                { title: 'Issue', dataIndex: 'message', key: 'message', render: () => 'Must be at least 14 digits' }
                                            ]}
                                        />
                                    </Card>
                                )}

                                {/* Missing Required Fields */}
                                {validationErrors.missingRequired?.length > 0 && (
                                    <Card title={`Missing Required Fields (${validationErrors.missingRequired.length})`} style={{ marginBottom: 16 }}>
                                        <Table
                                            dataSource={validationErrors.missingRequired}
                                            rowKey={(record: any, index: number) => `miss-${index}`}
                                            pagination={{ pageSize: 10 }}
                                            size="small"
                                            columns={[
                                                { title: 'Row', dataIndex: 'row', key: 'row', width: 80 },
                                                { title: 'Field', dataIndex: 'field', key: 'field' }
                                            ]}
                                        />
                                    </Card>
                                )}

                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <Button onClick={() => setValidationErrors(null)}>
                                        Clear Errors
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {currentStep === 1 && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <SyncOutlined spin style={{ fontSize: 48, color: '#043168' }} />
                        <h3>Uploading data to temporary table...</h3>
                        <p>Please wait while we process your file.</p>

                        {loading && (
                            <div style={{ marginTop: 24, maxWidth: 600, margin: '24px auto 0' }}>
                                <Progress
                                    percent={progress}
                                    status="active"
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                                <div style={{ textAlign: 'center', marginTop: 8 }}>
                                    <span>{progressMessage}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <Alert
                            message="Review Changes"
                            description={
                                <div>
                                    <p>Review the changes below before applying them to the main table.</p>
                                    <Space>
                                        <Tag color="#28a745">New: {newRecordsCount}</Tag>
                                        <Tag color="#043168">Modified: {modifiedRecordsCount}</Tag>
                                        <Tag color="#dc3545">Deleted: {deletedRecordsCount}</Tag>
                                    </Space>
                                </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Alert
                            message={
                                <Space>
                                    <InfoCircleOutlined />
                                    <span>Whitespace Detection</span>
                                </Space>
                            }
                            description={
                                <div>
                                    <p style={{ marginBottom: 8 }}>When values contain leading or trailing spaces, they will be highlighted with:</p>
                                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                                        <li><strong>⎵</strong> symbol - Represents spaces that would otherwise be invisible</li>
                                        <li><InfoCircleOutlined style={{ color: '#faad14' }} /> Warning icon - Indicates whitespace detected</li>
                                        <li><Badge count={35} style={{ backgroundColor: '#faad14' }} /> Character count - Shows total length including whitespace</li>
                                        <li>Hover over values to see detailed whitespace information</li>
                                    </ul>
                                </div>
                            }
                            type="warning"
                            showIcon
                            closable
                            style={{ marginBottom: 16 }}
                        />

                        <Table
                            columns={comparisonColumns}
                            dataSource={differences}
                            rowKey={(record) => `${record.change_type}|||${record.item_code}|||${record.field_name}`}
                            pagination={{ pageSize: 50 }}
                            scroll={{ x: 1400, y: 600 }}
                            rowSelection={{
                                selectedRowKeys: selectedChanges,
                                onChange: (keys) => setSelectedChanges(keys as string[]),
                            }}
                        />

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button onClick={resetUpload}>Cancel</Button>
                            <Space>
                                <Button
                                    type="default"
                                    onClick={() => applyChanges(true)}
                                    loading={loading}
                                    disabled={differences.length === 0}
                                >
                                    Apply All Changes ({differences.length})
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => applyChanges(false)}
                                    loading={loading}
                                    disabled={selectedChanges.length === 0}
                                >
                                    Apply Selected Changes ({selectedChanges.length})
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        <h3>Changes Applied Successfully!</h3>
                        <p>Your data has been updated in the main table.</p>
                        <Button type="primary" size="large" onClick={resetUpload}>
                            Upload Another File
                        </Button>
                    </div>
                )}
            </Card>

            {/* Processing Rules Card */}
            <Card
                title="Processing Rules & Information"
                variant="borderless"
                style={{
                    marginTop: 24,
                    borderRadius: 8,
                    borderLeft: '4px solid #52c41a',
                    backgroundColor: '#f6ffed'
                }}
            >
                <List
                    size="small"
                    dataSource={[
                        'File validation checks for duplicate Item Codes and UPC codes',
                        'UPC codes must be either 12 or 14 digits in length',
                        'Required fields: Brand Name and Item Code must be present',
                        'Data is uploaded to a temporary table for comparison before applying changes',
                        'You can review all changes (NEW, MODIFIED, DELETED) before applying them',
                        'Changes can be applied selectively or all at once',
                        'The comparison shows differences between the temp table and main table',
                    ]}
                    renderItem={(item) => (
                        <List.Item>
                            <span style={{ color: '#555' }}>• {item}</span>
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default DataTeamUploadPage;
