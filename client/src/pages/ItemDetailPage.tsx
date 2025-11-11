import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Descriptions, Space, App, Tag, Table, Alert } from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    FileTextOutlined,
    BarcodeOutlined,
    SafetyOutlined,
    ExperimentOutlined,
    EnvironmentOutlined,
    MedicineBoxOutlined,
    InfoCircleOutlined,
    ExpandOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import './ItemDetailPage.css';

interface ItemDetail {
    id: number;
    brand_name: string;
    item: string;
    description1: string;
    description2: string;
    description3: string;
    uom_units_inner_2: string;
    uom_pack_inner_1: string;
    uom_sellable: string;
    uom_ship_1: string;
    uom_ship_2: string;
    upc_inner_2: string;
    upc_inner_1: string;
    upc_sellable: string;
    upc_ship_1: string;
    upc_ship_2: string;
    ar_inner_2: string;
    ar_inner_1: string;
    ar_sellable: string;
    ar_ship_1: string;
    ar_ship_2: string;
    hcpc_code: string;
    product_type: string;
    fei_number: string;
    duns_number: string;
    dln: string;
    device_class: string;
    product_code: string;
    fda_510_k: string;
    exp_date: string;
    sn_number: string;
    sterile: string;
    sterile_method: string;
    shelf_life: string;
    prop_65: string;
    prop_65_warning: string;
    rx_required: string;
    dehp_free: string;
    latex: string;
    use_field: string;
    temp_required: string;
    temp_range: string;
    humidity_limitation: string;
    gtin_inner_2: string;
    gtin_inner_1: string;
    gtin_sellable: string;
    gtin_ship_1: string;
    gtin_ship_2: string;
    product_identification: string;
    term_code: string;
    ndc_inner_2: string;
    ndc_inner_1: string;
    ndc_sellable: string;
    ndc_shipper_1: string;
    ndc_shipper_2: string;
    hc_class: string;
    license_number: string;
    created_date: string;
    [key: string]: any;
}

const ItemDetailPage: React.FC = () => {
    const { message } = App.useApp();
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [mismatches, setMismatches] = useState<any[]>([]);
    const [measurementsLoading, setMeasurementsLoading] = useState(false);
    const [mismatchesLoading, setMismatchesLoading] = useState(false);

    useEffect(() => {
        if (itemId) {
            fetchItemDetail(itemId);
            fetchMeasurements(itemId);
            fetchMismatches(itemId);
        }
    }, [itemId]);

    const fetchItemDetail = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/data-team-item/${id}`);
            if (response.data.success) {
                setItem(response.data.data);
            } else {
                message.error('Failed to load item details');
            }
        } catch (error: any) {
            console.error('Error fetching item details:', error);
            message.error(error.response?.data?.error || 'Error loading item details');
        } finally {
            setLoading(false);
        }
    };

    const fetchMeasurements = async (id: string) => {
        setMeasurementsLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/data-team-item/${id}/measurements`);
            if (response.data.success) {
                setMeasurements(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching measurements:', error);
            // Don't show error message if no measurements found - it's optional data
        } finally {
            setMeasurementsLoading(false);
        }
    };

    const fetchMismatches = async (id: string) => {
        setMismatchesLoading(true);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/data-team-item/${id}/mismatches`);
            if (response.data.success) {
                setMismatches(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching mismatches:', error);
            // Don't show error message if no mismatches found - it's optional data
        } finally {
            setMismatchesLoading(false);
        }
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') {
            return <Tag className="value-badge na">N/A</Tag>;
        }
        return value;
    };

    const formatYesNo = (value: any) => {
        if (value === null || value === undefined || value === '') {
            return <Tag className="value-badge na">N/A</Tag>;
        }
        const strValue = String(value).toLowerCase();
        if (strValue === 'yes' || strValue === 'y' || strValue === 'true' || strValue === '1') {
            return <Tag className="value-badge yes">Yes</Tag>;
        }
        if (strValue === 'no' || strValue === 'n' || strValue === 'false' || strValue === '0') {
            return <Tag className="value-badge no">No</Tag>;
        }
        return <span>{value}</span>;
    };

    const formatCode = (value: any) => {
        if (value === null || value === undefined || value === '') {
            return <Tag className="value-badge na">N/A</Tag>;
        }
        return <span className="code-value">{value}</span>;
    };

    const formatUPC = (value: any) => {
        if (value === null || value === undefined || value === '') {
            return <Tag className="value-badge na">N/A</Tag>;
        }
        return <span className="upc-value">{value}</span>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return <Tag className="value-badge na">N/A</Tag>;
        try {
            const date = new Date(dateString);
            return <span className="date-value">{date.toLocaleDateString()}</span>;
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="item-detail-page">
                <div className="item-detail-loading">
                    <Spin size="large" tip="Loading item details..." />
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="item-detail-page">
                <div className="item-detail-empty">
                    <InfoCircleOutlined className="item-detail-empty-icon" />
                    <p className="item-detail-empty-text">Item not found</p>
                    <Button
                        type="primary"
                        size="large"
                        className="action-button action-button-primary"
                        onClick={() => navigate('/items-new')}
                    >
                        Back to Items
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="item-detail-page">
            <Card className="item-detail-card">
                <div className="item-detail-header">
                    <div style={{ marginBottom: 12 }}>
                        <h1 className="item-detail-title">
                            <FileTextOutlined style={{ marginRight: 12 }} />
                            Item Details
                        </h1>
                        <div className="item-detail-subtitle">
                            Complete product information and specifications
                        </div>
                    </div>
                    <Space size="large" style={{ marginTop: 16 }}>
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Item Code</div>
                            <span className="item-detail-tag">{item.item}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Brand</div>
                            <span className="item-detail-tag">{item.brand_name || 'N/A'}</span>
                        </div>
                    </Space>
                    <div className="item-detail-actions" style={{ marginTop: 20 }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/items-new')}
                        >
                            Back to List
                        </Button>
                        <Button
                            icon={<EditOutlined />}
                        >
                            Edit Item
                        </Button>
                    </div>
                </div>

                <div className="item-detail-content">
                    {/* Basic Information */}
                    <Descriptions title="Basic Information" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="ID">{item.id}</Descriptions.Item>
                    <Descriptions.Item label="Item Code">{formatValue(item.item)}</Descriptions.Item>
                    <Descriptions.Item label="Brand Name">{formatValue(item.brand_name)}</Descriptions.Item>
                    <Descriptions.Item label="Created Date">{formatDate(item.created_date)}</Descriptions.Item>
                </Descriptions>

                {/* Descriptions */}
                <Descriptions title="Product Descriptions" bordered column={1} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Description 1">{formatValue(item.description1)}</Descriptions.Item>
                    <Descriptions.Item label="Description 2">{formatValue(item.description2)}</Descriptions.Item>
                    <Descriptions.Item label="Description 3">{formatValue(item.description3)}</Descriptions.Item>
                </Descriptions>

                {/* UOM Information */}
                <Descriptions title="Unit of Measure (UOM)" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="UOM Units Inner-2">{formatValue(item.uom_units_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="UOM Pack Inner-1">{formatValue(item.uom_pack_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="UOM Sellable">{formatValue(item.uom_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="UOM Ship-1">{formatValue(item.uom_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="UOM Ship-2">{formatValue(item.uom_ship_2)}</Descriptions.Item>
                </Descriptions>

                {/* UPC Codes */}
                <Descriptions title={<><BarcodeOutlined className="section-icon" /> UPC Codes</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="UPC Inner-2">{formatUPC(item.upc_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Inner-1">{formatUPC(item.upc_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Sellable">{formatUPC(item.upc_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Ship-1">{formatUPC(item.upc_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Ship-2">{formatUPC(item.upc_ship_2)}</Descriptions.Item>
                </Descriptions>

                {/* Artwork Rev */}
                <Descriptions title="Artwork Rev" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="AR Inner-2">{formatValue(item.ar_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="AR Inner-1">{formatValue(item.ar_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="AR Sellable">{formatValue(item.ar_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="AR Ship-1">{formatValue(item.ar_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="AR Ship-2">{formatValue(item.ar_ship_2)}</Descriptions.Item>
                </Descriptions>

                {/* Regulatory Information */}
                <Descriptions title={<><ExperimentOutlined className="section-icon" /> Regulatory & Product Information</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="HCPC Code">{formatCode(item.hcpc_code)}</Descriptions.Item>
                    <Descriptions.Item label="Product Type">{formatValue(item.product_type)}</Descriptions.Item>
                    <Descriptions.Item label="FEI Number">{formatCode(item.fei_number)}</Descriptions.Item>
                    <Descriptions.Item label="DUNS Number">{formatCode(item.duns_number)}</Descriptions.Item>
                    <Descriptions.Item label="DLN">{formatCode(item.dln)}</Descriptions.Item>
                    <Descriptions.Item label="Device Class">{formatValue(item.device_class)}</Descriptions.Item>
                    <Descriptions.Item label="Product Code">{formatCode(item.product_code)}</Descriptions.Item>
                    <Descriptions.Item label="FDA 510(k)">{formatCode(item.fda_510_k)}</Descriptions.Item>
                    <Descriptions.Item label="Expiration Date">{formatDate(item.exp_date)}</Descriptions.Item>
                    <Descriptions.Item label="Serial Number">{formatCode(item.sn_number)}</Descriptions.Item>
                    <Descriptions.Item label="Product Identification">{formatValue(item.product_identification)}</Descriptions.Item>
                    <Descriptions.Item label="Term Code">{formatCode(item.term_code)}</Descriptions.Item>
                    <Descriptions.Item label="HC Class">{formatValue(item.hc_class)}</Descriptions.Item>
                    <Descriptions.Item label="License Number">{formatCode(item.license_number)}</Descriptions.Item>
                </Descriptions>

                {/* Sterility & Storage */}
                <Descriptions title={<><EnvironmentOutlined className="section-icon" /> Sterility & Storage Requirements</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Sterile">{formatYesNo(item.sterile)}</Descriptions.Item>
                    <Descriptions.Item label="Sterile Method">{formatValue(item.sterile_method)}</Descriptions.Item>
                    <Descriptions.Item label="Shelf Life">{formatValue(item.shelf_life)}</Descriptions.Item>
                    <Descriptions.Item label="Use">{formatValue(item.use_field)}</Descriptions.Item>
                    <Descriptions.Item label="Temp Required">{formatYesNo(item.temp_required)}</Descriptions.Item>
                    <Descriptions.Item label="Temp Range">{formatValue(item.temp_range)}</Descriptions.Item>
                    <Descriptions.Item label="Humidity Limitation">{formatValue(item.humidity_limitation)}</Descriptions.Item>
                </Descriptions>

                {/* Safety & Compliance */}
                <Descriptions title={<><SafetyOutlined className="section-icon" /> Safety & Compliance</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Prop 65">{formatYesNo(item.prop_65)}</Descriptions.Item>
                    <Descriptions.Item label="Prop 65 Warning">{formatValue(item.prop_65_warning)}</Descriptions.Item>
                    <Descriptions.Item label="RX Required">{formatYesNo(item.rx_required)}</Descriptions.Item>
                    <Descriptions.Item label="DEHP Free">{formatYesNo(item.dehp_free)}</Descriptions.Item>
                    <Descriptions.Item label="Latex">{formatYesNo(item.latex)}</Descriptions.Item>
                </Descriptions>

                {/* GTIN Codes */}
                <Descriptions title={<><BarcodeOutlined className="section-icon" /> GTIN Codes</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="GTIN Inner-2">{formatUPC(item.gtin_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Inner-1">{formatUPC(item.gtin_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Sellable">{formatUPC(item.gtin_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Ship-1">{formatUPC(item.gtin_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Ship-2">{formatUPC(item.gtin_ship_2)}</Descriptions.Item>
                </Descriptions>

                {/* NDC Numbers */}
                <Descriptions title={<><MedicineBoxOutlined className="section-icon" /> NDC Numbers</>} bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="NDC Inner-2">{formatCode(item.ndc_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Inner-1">{formatCode(item.ndc_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Sellable">{formatCode(item.ndc_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Shipper +1">{formatCode(item.ndc_shipper_1)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Shipper +2">{formatCode(item.ndc_shipper_2)}</Descriptions.Item>
                </Descriptions>

                {/* Product Measurements with UPC Data */}
                <div style={{ marginTop: 32 }}>
                    <div className="section-header">
                        <ExpandOutlined className="section-icon" />
                        <h3 className="section-title">Product Measurements with UPC Data</h3>
                    </div>
                    {measurementsLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin />
                        </div>
                    ) : measurements.length > 0 ? (
                        <Table
                            dataSource={measurements}
                            rowKey={(record, index) => `measurement-${index}`}
                            pagination={false}
                            scroll={{ x: 1200 }}
                            bordered
                            size="small"
                            style={{ marginBottom: 24 }}
                        >
                            <Table.Column title="UPC" dataIndex="upc" key="upc" render={formatUPC} />
                            <Table.Column title="Level" dataIndex="measurement_level" key="measurement_level" />
                            <Table.Column title="Weight (lbs)" dataIndex="weight" key="weight" render={(val) => val?.toFixed(2) || 'N/A'} />
                            <Table.Column title="Height (in)" dataIndex="height" key="height" render={(val) => val?.toFixed(2) || 'N/A'} />
                            <Table.Column title="Length (in)" dataIndex="length" key="length" render={(val) => val?.toFixed(2) || 'N/A'} />
                            <Table.Column title="Width (in)" dataIndex="width" key="width" render={(val) => val?.toFixed(2) || 'N/A'} />
                            <Table.Column title="Volume (cu in)" dataIndex="calculated_volume" key="calculated_volume" render={(val) => val?.toFixed(2) || 'N/A'} />
                            <Table.Column title="Confirmed" dataIndex="confirmed" key="confirmed" render={formatYesNo} />
                            <Table.Column title="UPC List Level" dataIndex="upc_list_level_name" key="upc_list_level_name" render={formatValue} />
                            <Table.Column title="Is Sellable" dataIndex="IsSellable" key="IsSellable" render={formatYesNo} />
                        </Table>
                    ) : (
                        <Alert
                            message="No Measurement Data"
                            description="No product measurements with UPC data available for this item."
                            type="info"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}
                </div>

                {/* Product Measurement Mismatches */}
                <div style={{ marginTop: 32 }}>
                    <div className="section-header">
                        <WarningOutlined className="section-icon" style={{ color: '#faad14' }} />
                        <h3 className="section-title" style={{ color: '#faad14' }}>Product Measurement Mismatches</h3>
                    </div>
                    {mismatchesLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin />
                        </div>
                    ) : mismatches.length > 0 ? (
                        <>
                            <Alert
                                message={`Found ${mismatches.length} Mismatch${mismatches.length > 1 ? 'es' : ''}`}
                                description="These records show discrepancies between measurement data and UPC list data."
                                type="warning"
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                            <Table
                                dataSource={mismatches}
                                rowKey={(record, index) => `mismatch-${index}`}
                                pagination={false}
                                scroll={{ x: 1200 }}
                                bordered
                                size="small"
                                style={{ marginBottom: 24 }}
                            >
                                <Table.Column title="UPC" dataIndex="upc" key="upc" render={formatUPC} />
                                <Table.Column title="Measurement Level" dataIndex="measurement_level" key="measurement_level" />
                                <Table.Column title="UPC List Level" dataIndex="upc_list_level_number" key="upc_list_level_number" />
                                <Table.Column title="Mismatch Type" dataIndex="mismatch_type" key="mismatch_type" render={(val) => <Tag color="orange">{val}</Tag>} />
                                <Table.Column title="Weight (lbs)" dataIndex="weight" key="weight" render={(val) => val?.toFixed(2) || 'N/A'} />
                                <Table.Column title="Height (in)" dataIndex="height" key="height" render={(val) => val?.toFixed(2) || 'N/A'} />
                                <Table.Column title="Length (in)" dataIndex="length" key="length" render={(val) => val?.toFixed(2) || 'N/A'} />
                                <Table.Column title="Width (in)" dataIndex="width" key="width" render={(val) => val?.toFixed(2) || 'N/A'} />
                                <Table.Column title="Volume (cu in)" dataIndex="calculated_volume" key="calculated_volume" render={(val) => val?.toFixed(2) || 'N/A'} />
                                <Table.Column title="Confirmed" dataIndex="confirmed" key="confirmed" render={formatYesNo} />
                            </Table>
                        </>
                    ) : (
                        <Alert
                            message="No Mismatches Found"
                            description="All measurement data matches the UPC list data for this item."
                            type="success"
                            showIcon
                            style={{ marginBottom: 24 }}
                        />
                    )}
                </div>
                </div>
            </Card>
        </div>
    );
};

export default ItemDetailPage;
