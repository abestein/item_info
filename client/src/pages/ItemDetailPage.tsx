import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, Descriptions, Space, App, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

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
    rx_required: string;
    temp_required: string;
    gtin_inner_2: string;
    gtin_inner_1: string;
    gtin_sellable: string;
    gtin_ship_1: string;
    gtin_ship_2: string;
    ndc_inner_2: string;
    ndc_inner_1: string;
    ndc_sellable: string;
    ndc_ship_1: string;
    ndc_ship_2: string;
    created_date: string;
    [key: string]: any;
}

const ItemDetailPage: React.FC = () => {
    const { message } = App.useApp();
    const { itemId } = useParams<{ itemId: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<ItemDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (itemId) {
            fetchItemDetail(itemId);
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

    const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') {
            return <Tag color="#6c757d">N/A</Tag>;
        }
        return value;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return <Tag color="#6c757d">N/A</Tag>;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!item) {
        return (
            <div style={{ padding: 'var(--spacing-lg)' }}>
                <Card>
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <p style={{ fontSize: 16, color: '#8c8c8c' }}>Item not found</p>
                        <Button type="primary" onClick={() => navigate('/items-new')}>
                            Back to Items
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Card
                title={
                    <Space>
                        <span>Item Details</span>
                        <Tag color="#043168">{item.item}</Tag>
                    </Space>
                }
                extra={
                    <Space>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/items-new')}
                        >
                            Back to List
                        </Button>
                    </Space>
                }
            >
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
                <Descriptions title="UPC Codes" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="UPC Inner-2">{formatValue(item.upc_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Inner-1">{formatValue(item.upc_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Sellable">{formatValue(item.upc_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Ship-1">{formatValue(item.upc_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="UPC Ship-2">{formatValue(item.upc_ship_2)}</Descriptions.Item>
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
                <Descriptions title="Regulatory & Product Information" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="HCPC Code">{formatValue(item.hcpc_code)}</Descriptions.Item>
                    <Descriptions.Item label="Product Type">{formatValue(item.product_type)}</Descriptions.Item>
                    <Descriptions.Item label="FEI Number">{formatValue(item.fei_number)}</Descriptions.Item>
                    <Descriptions.Item label="DLN">{formatValue(item.dln)}</Descriptions.Item>
                    <Descriptions.Item label="Device Class">{formatValue(item.device_class)}</Descriptions.Item>
                    <Descriptions.Item label="Product Code">{formatValue(item.product_code)}</Descriptions.Item>
                    <Descriptions.Item label="FDA 510(k)">{formatValue(item.fda_510_k)}</Descriptions.Item>
                    <Descriptions.Item label="Expiration Date">{formatDate(item.exp_date)}</Descriptions.Item>
                    <Descriptions.Item label="Serial Number">{formatValue(item.sn_number)}</Descriptions.Item>
                </Descriptions>

                {/* Sterility & Storage */}
                <Descriptions title="Sterility & Storage Requirements" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Sterile">{formatValue(item.sterile)}</Descriptions.Item>
                    <Descriptions.Item label="Sterile Method">{formatValue(item.sterile_method)}</Descriptions.Item>
                    <Descriptions.Item label="Shelf Life">{formatValue(item.shelf_life)}</Descriptions.Item>
                    <Descriptions.Item label="Prop 65">{formatValue(item.prop_65)}</Descriptions.Item>
                    <Descriptions.Item label="RX Required">{formatValue(item.rx_required)}</Descriptions.Item>
                    <Descriptions.Item label="Temp Required">{formatValue(item.temp_required)}</Descriptions.Item>
                </Descriptions>

                {/* GTIN Codes */}
                <Descriptions title="GTIN Codes" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="GTIN Inner-2">{formatValue(item.gtin_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Inner-1">{formatValue(item.gtin_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Sellable">{formatValue(item.gtin_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Ship-1">{formatValue(item.gtin_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="GTIN Ship-2">{formatValue(item.gtin_ship_2)}</Descriptions.Item>
                </Descriptions>

                {/* NDC Numbers */}
                <Descriptions title="NDC Numbers" bordered column={2} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="NDC Inner-2">{formatValue(item.ndc_inner_2)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Inner-1">{formatValue(item.ndc_inner_1)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Sellable">{formatValue(item.ndc_sellable)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Ship-1">{formatValue(item.ndc_ship_1)}</Descriptions.Item>
                    <Descriptions.Item label="NDC Ship-2">{formatValue(item.ndc_ship_2)}</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
};

export default ItemDetailPage;
