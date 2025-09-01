// src/config/tableConfig.tsx
import React from 'react';
import { Input, DatePicker, Select, InputNumber, Button, Space } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnType, FilterDropdownProps } from 'antd/es/table/interface';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Table style presets
export const tableStyles = {
    default: {
        bordered: true,
        size: 'middle' as const,
        scroll: { x: 'max-content' },
        pagination: {
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
        },
    },
    compact: {
        bordered: false,
        size: 'small' as const,
        scroll: { x: 'max-content' },
        pagination: {
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} items`,
            pageSizeOptions: ['25', '50', '100', '200'],
        },
    },
    report: {
        bordered: true,
        size: 'middle' as const,
        scroll: { x: 'max-content' },
        pagination: false, // Reports often don't need pagination
    },
};

// Dynamic filter components based on data type
export const getColumnFilters = (dataType: 'text' | 'number' | 'date' | 'select', options?: { label: string; value: any }[]) => {
    switch (dataType) {
        case 'text':
            return {
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                        <Input
                            placeholder="Search..."
                            value={selectedKeys[0]}
                            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                            onPressEnter={() => confirm()}
                            style={{ marginBottom: 8, display: 'block' }}
                        />
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => confirm()}
                                icon={<SearchOutlined />}
                                size="small"
                                style={{ width: 90 }}
                            >
                                Search
                            </Button>
                            <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
                                Reset
                            </Button>
                        </Space>
                    </div>
                ),
                filterIcon: (filtered: boolean) => (
                    <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
                ),
                onFilter: (value: any, record: any, dataIndex: string) =>
                    record[dataIndex]
                        ?.toString()
                        .toLowerCase()
                        .includes(value.toString().toLowerCase()),
            };

        case 'number':
            return {
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <InputNumber
                                placeholder="Min"
                                value={selectedKeys[0]}
                                onChange={(value) => setSelectedKeys(value !== null ? [value, selectedKeys[1]] : [undefined, selectedKeys[1]])}
                                style={{ width: '100%' }}
                            />
                            <InputNumber
                                placeholder="Max"
                                value={selectedKeys[1]}
                                onChange={(value) => setSelectedKeys([selectedKeys[0], value !== null ? value : undefined])}
                                style={{ width: '100%' }}
                            />
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={() => confirm()}
                                    icon={<FilterOutlined />}
                                    size="small"
                                    style={{ width: 90 }}
                                >
                                    Filter
                                </Button>
                                <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
                                    Reset
                                </Button>
                            </Space>
                        </Space>
                    </div>
                ),
                filterIcon: (filtered: boolean) => (
                    <FilterOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
                ),
                onFilter: (value: any, record: any, dataIndex: string) => {
                    const [min, max] = value;
                    const recordValue = record[dataIndex];
                    if (min !== undefined && max !== undefined) {
                        return recordValue >= min && recordValue <= max;
                    } else if (min !== undefined) {
                        return recordValue >= min;
                    } else if (max !== undefined) {
                        return recordValue <= max;
                    }
                    return true;
                },
            };

        case 'date':
            return {
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
                    <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                        <RangePicker
                            value={selectedKeys[0] ? [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])] : null}
                            onChange={(dates) => {
                                if (dates) {
                                    setSelectedKeys([dates[0]?.toISOString(), dates[1]?.toISOString()]);
                                } else {
                                    setSelectedKeys([]);
                                }
                            }}
                            style={{ marginBottom: 8 }}
                        />
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => confirm()}
                                icon={<FilterOutlined />}
                                size="small"
                                style={{ width: 90 }}
                            >
                                Filter
                            </Button>
                            <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>
                                Reset
                            </Button>
                        </Space>
                    </div>
                ),
                filterIcon: (filtered: boolean) => (
                    <FilterOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
                ),
                onFilter: (value: any, record: any, dataIndex: string) => {
                    if (!value || value.length !== 2) return true;
                    const recordDate = dayjs(record[dataIndex]);
                    const [start, end] = value.map((d: string) => dayjs(d));
                    return recordDate.isAfter(start) && recordDate.isBefore(end);
                },
            };

        case 'select':
            return {
                filters: options,
                onFilter: (value: any, record: any, dataIndex: string) => record[dataIndex] === value,
            };

        default:
            return {};
    }
};

// Helper to enhance columns with filters and sorting
export const enhanceColumns = <T extends Record<string, any>>(
    columns: ColumnType<T>[],
    config?: {
        [key: string]: {
            type: 'text' | 'number' | 'date' | 'select';
            options?: { label: string; value: any }[];
            sortable?: boolean;
            customFilter?: any;
        };
    }
): ColumnType<T>[] => {
    return columns.map((col) => {
        const key = col.dataIndex as string;
        const colConfig = config?.[key];

        if (!colConfig) return col;

        const enhanced: ColumnType<T> = { ...col };

        // Add filters
        if (colConfig.type && !colConfig.customFilter) {
            Object.assign(enhanced, getColumnFilters(colConfig.type, colConfig.options));
        } else if (colConfig.customFilter) {
            Object.assign(enhanced, colConfig.customFilter);
        }

        // Add sorting
        if (colConfig.sortable !== false) {
            if (colConfig.type === 'number') {
                enhanced.sorter = (a: T, b: T) => (a[key] || 0) - (b[key] || 0);
            } else if (colConfig.type === 'date') {
                enhanced.sorter = (a: T, b: T) => {
                    const dateA = a[key] ? new Date(a[key]).getTime() : 0;
                    const dateB = b[key] ? new Date(b[key]).getTime() : 0;
                    return dateA - dateB;
                };
            } else if (colConfig.type === 'text') {
                enhanced.sorter = (a: T, b: T) => {
                    const valA = a[key] || '';
                    const valB = b[key] || '';
                    return valA.localeCompare(valB);
                };
            }
        }

        return enhanced;
    });
};

// Currency formatter
export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `$${Number(value).toFixed(2)}`;
};

// Percentage formatter
export const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${(Number(value) * 100).toFixed(2)}%`;
};

// Date formatter
export const formatDate = (date: string | null | undefined): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
};

// Common render functions
export const renderFunctions = {
    currency: (value: number) => formatCurrency(value),
    percentage: (value: number) => formatPercentage(value),
    date: (date: string) => formatDate(date),
    text: (text: string) => text || '-',
    ellipsis: (text: string, maxLength: number = 50) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    },
};