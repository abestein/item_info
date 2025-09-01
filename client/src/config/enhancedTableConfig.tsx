// src/config/enhancedTableConfig.tsx
import React, { useState, useEffect } from 'react';
import { Input, DatePicker, Select, InputNumber, Table, Space, Tag, Tooltip, Button } from 'antd';
import { SearchOutlined, FilterOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ColumnType } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';

const { RangePicker } = DatePicker;

// Enhanced table component with filter row
export interface FilterConfig {
    [key: string]: {
        type: 'text' | 'number' | 'date' | 'select';
        options?: { label: string; value: any }[];
    };
}

export type FilterMode = 'AND' | 'OR';

interface EnhancedTableProps<T> extends TableProps<T> {
    filterConfig?: FilterConfig;
    onFiltersChange?: (filters: any) => void;
    defaultFilterMode?: FilterMode;
}

// Helper function to check if a value matches a filter
const matchesFilter = (recordValue: any, filterValue: any, type: string): boolean => {
    switch (type) {
        case 'text':
            if (!filterValue || filterValue === '') return false;
            if (recordValue === null || recordValue === undefined) return false;

            // Split by pipe and filter out empty strings
            const searchTerms = filterValue
                .split('|')
                .map((term: string) => term.trim())
                .filter((term: string) => term.length > 0);

            // If no valid search terms after splitting, return false
            if (searchTerms.length === 0) return false;

            const recordStr = String(recordValue);
            const recordLower = recordStr.toLowerCase();

            // Temporary debug for pipe searches
            if (filterValue.includes('|')) {
                console.log('Pipe search debug:', {
                    originalFilter: filterValue,
                    searchTerms: searchTerms,
                    recordValue: recordStr,
                    recordLower: recordLower
                });
            }

            // Check if ANY search term is found in the record
            const matches = searchTerms.some((term: string) => {
                const termLower = term.toLowerCase();
                const isMatch = recordLower.includes(termLower);

                if (filterValue.includes('|')) {
                    console.log(`  Checking if "${recordLower}" includes "${termLower}": ${isMatch}`);
                }

                return isMatch;
            });

            if (filterValue.includes('|')) {
                console.log(`  Final result: ${matches}`);
            }

            return matches;

        case 'number':
            if (!filterValue || !Array.isArray(filterValue)) return false;
            const [min, max] = filterValue;
            // Check if at least one bound is set
            if (min === null && min !== 0 && max === null && max !== 0) return false;
            if (min === undefined && max === undefined) return false;

            const numValue = Number(recordValue);
            if (isNaN(numValue)) return false;

            if ((min !== null && min !== undefined) && (max !== null && max !== undefined)) {
                return numValue >= min && numValue <= max;
            } else if (min !== null && min !== undefined) {
                return numValue >= min;
            } else if (max !== null && max !== undefined) {
                return numValue <= max;
            }
            return false;

        case 'date':
            if (!filterValue || !Array.isArray(filterValue)) return false;
            const [startDate, endDate] = filterValue;
            // Check if at least one date is set
            if (!startDate && !endDate) return false;
            if (!recordValue) return false;

            const recordDate = dayjs(recordValue);
            if (!recordDate.isValid()) return false;

            if (startDate && endDate) {
                return recordDate.isAfter(startDate) && recordDate.isBefore(endDate.endOf('day'));
            } else if (startDate) {
                return recordDate.isAfter(startDate) || recordDate.isSame(startDate, 'day');
            } else if (endDate) {
                return recordDate.isBefore(endDate.endOf('day')) || recordDate.isSame(endDate, 'day');
            }
            return false;

        case 'select':
            if (!filterValue) return false;
            return recordValue === filterValue;

        default:
            return false;
    }
};

export function EnhancedTable<T extends Record<string, any>>({
    columns = [],
    dataSource = [],
    filterConfig,
    onFiltersChange,
    defaultFilterMode = 'AND',
    ...restProps
}: EnhancedTableProps<T>) {
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [filteredData, setFilteredData] = useState(dataSource);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<FilterMode>(defaultFilterMode);
    const inputRefs = React.useRef<Record<string, any>>({});

    // Apply filters function
    const applyFilters = (currentFilters: Record<string, any>, data: T[], mode: FilterMode) => {
        console.log('=== applyFilters called (not debounced) ===', {
            filters: currentFilters,
            dataLength: data.length,
            mode
        });

        let filtered = [...data];

        // Get active filters (properly check for partial values)
        const activeFilters = Object.entries(currentFilters).filter(
            ([key, value]) => {
                if (!value) return false;
                if (Array.isArray(value)) {
                    // For array values (number/date ranges), check if at least one value exists
                    return value.some(v => v !== null && v !== undefined && v !== '');
                }
                return value !== '';
            }
        );

        if (activeFilters.length === 0) {
            setFilteredData(data);
            return;
        }

        if (mode === 'AND') {
            // AND mode: record must match ALL filters
            console.log('Running AND mode filtering with:', activeFilters);
            activeFilters.forEach(([key, value]) => {
                const config = filterConfig?.[key];
                if (!config) return;

                console.log(`Filtering ${key} with value:`, value);
                const beforeCount = filtered.length;
                filtered = filtered.filter((record) =>
                    matchesFilter(record[key], value, config.type)
                );
                console.log(`After ${key} filter: ${beforeCount} → ${filtered.length} records`);
            });
        } else {
            // OR mode: record must match ANY filter
            filtered = data.filter((record) => {
                return activeFilters.some(([key, value]) => {
                    const config = filterConfig?.[key];
                    if (!config) return false;
                    return matchesFilter(record[key], value, config.type);
                });
            });
        }

        setFilteredData(filtered);
    };

    // Debounced version
    const debouncedApplyFilters = React.useMemo(
        () => debounce(applyFilters, 300),
        [filterConfig]
    );

    // Update filtered data when dataSource changes
    useEffect(() => {
        console.log('dataSource changed, length:', dataSource.length);
        setFilteredData(dataSource);
    }, [dataSource]);

    // Restore focus after render
    useEffect(() => {
        if (focusedField && inputRefs.current[focusedField]) {
            inputRefs.current[focusedField].focus();
        }
    });

    useEffect(() => {
        console.log('Filters or mode changed:', { filters, filterMode });
        debouncedApplyFilters(filters, dataSource, filterMode);
    }, [filters, dataSource, filterMode, debouncedApplyFilters]);

    // Notify parent about filter changes
    useEffect(() => {
        onFiltersChange?.(filters);
    }, [filters, onFiltersChange]);

    // Create filter row with memoization
    const filterRow = React.useMemo(() => {
        if (!filterConfig) return null;

        return (
            <tr className="table-filter-row">
                {columns.map((col) => {
                    const key = col.dataIndex as string;
                    const config = filterConfig[key];

                    if (!config) {
                        return <td key={key} style={{ padding: '8px', background: '#fafafa' }}></td>;
                    }

                    return (
                        <td key={key} style={{ padding: '8px', background: '#fafafa' }}>
                            {renderFilterInput(
                                key,
                                config,
                                filters[key],
                                (value) => {
                                    console.log(`Setting filter for ${key}:`, value);
                                    setFilters(prev => ({ ...prev, [key]: value }));
                                },
                                (ref) => {
                                    inputRefs.current[key] = ref;
                                },
                                () => setFocusedField(key),
                                key  // Pass key for clear button focus
                            )}
                        </td>
                    );
                })}
            </tr>
        );
    }, [columns, filterConfig, filters]);

    // Enhanced columns with visual indicators
    const enhancedColumns = columns.map((col) => {
        const key = col.dataIndex as string;
        const hasFilter = filters[key] &&
            (Array.isArray(filters[key]) ? filters[key].some(v => v) : filters[key]);

        return {
            ...col,
            title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.title}
                    {hasFilter && <FilterOutlined style={{ color: '#1890ff', fontSize: 12 }} />}
                </div>
            ),
        };
    });

    return (
        <div className="enhanced-table-wrapper">
            <style>
                {`
          .enhanced-table-wrapper .ant-table-thead > tr:first-child > th {
            border-bottom: none;
          }
          .table-filter-row td {
            border-bottom: 2px solid #f0f0f0 !important;
            background: #fafafa;
          }
          .filter-input-wrapper {
            position: relative;
          }
          .filter-input-wrapper .ant-input {
            padding-right: 28px !important;
          }
          .filter-clear-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #999;
            font-size: 12px;
            z-index: 1;
          }
          .filter-clear-btn:hover {
            color: #666;
          }
          .number-filter-wrapper {
            position: relative;
          }
          .number-clear-btn {
            position: absolute;
            right: -20px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #999;
            font-size: 12px;
            z-index: 1;
          }
          .number-clear-btn:hover {
            color: #666;
          }
          .filter-mode-selector {
            margin-bottom: 12px;
            padding: 8px 12px;
            background: #f5f5f5;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .filter-mode-selector .ant-select {
            width: 100px;
          }
        `}
            </style>

            {filterConfig && (
                <div className="filter-mode-selector">
                    <Space>
                        <span>Filter Mode:</span>
                        <Select
                            value={filterMode}
                            onChange={setFilterMode}
                            size="small"
                            options={[
                                { label: 'Match ALL filters (AND)', value: 'AND' },
                                { label: 'Match ANY filter (OR)', value: 'OR' },
                            ]}
                            style={{ width: 200 }}
                        />
                        <Tooltip
                            title={
                                <div>
                                    <p><strong>AND mode:</strong> Shows rows matching ALL active filters</p>
                                    <p><strong>OR mode:</strong> Shows rows matching ANY active filter</p>
                                    <p><strong>Text search with pipe (|):</strong></p>
                                    <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
                                        <li>"ABC | XYZ" finds rows containing ABC or XYZ</li>
                                        <li>Each term is a partial match (e.g., "App" matches "Apple")</li>
                                        <li>Case-insensitive search</li>
                                    </ul>
                                </div>
                            }
                        >
                            <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                        </Tooltip>
                    </Space>

                    {Object.values(filters).some(v => v && (Array.isArray(v) ? v.some(val => val) : true)) && (
                        <Space>
                            <Tag color="blue">
                                {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.some(val => val) : true)).length} filters active
                            </Tag>
                            <a onClick={() => setFilters({})}>Clear all</a>
                        </Space>
                    )}
                </div>
            )}

            <Table<T>
                {...restProps}
                columns={enhancedColumns}
                dataSource={filteredData}
                components={{
                    header: {
                        wrapper: (props: any) => (
                            <thead {...props}>
                                {props.children}
                                {filterRow}
                            </thead>
                        ),
                    },
                }}
            />
        </div>
    );
}

// Render appropriate filter input based on type
function renderFilterInput(
    key: string,
    config: FilterConfig[string],
    value: any,
    onChange: (value: any) => void,
    setRef?: (ref: any) => void,
    onFocus?: () => void,
    fieldKey?: string
) {
    const clearable = value && (Array.isArray(value) ? value.some(v => v) : true);

    switch (config.type) {
        case 'text':
            return (
                <div className="filter-input-wrapper">
                    <Input
                        ref={setRef}
                        size="small"
                        placeholder="Search... (use | for OR)"
                        prefix={<SearchOutlined style={{ color: '#999' }} />}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={onFocus}
                        style={{ width: '100%' }}
                        title="Use pipe (|) for OR search. Example: 'ABC | XYZ' finds rows containing ABC or XYZ (partial match)"
                        allowClear
                        onClear={() => onChange('')}
                    />
                </div>
            );

        case 'number':
            const hasNumberValue = value && (value[0] !== null && value[0] !== undefined || value[1] !== null && value[1] !== undefined);
            return (
                <div style={{ width: '100%' }}>
                    <Space.Compact style={{ width: '100%' }}>
                        <InputNumber
                            ref={fieldKey === key && key === 'min' ? setRef : undefined}
                            size="small"
                            placeholder="Min"
                            value={value?.[0]}
                            onChange={(val) => onChange([val, value?.[1]])}
                            onFocus={onFocus}
                            style={{ width: hasNumberValue ? 'calc(50% - 14px)' : '50%' }}
                            controls={false}  // Remove spinner to save space
                        />
                        <InputNumber
                            ref={fieldKey === key && key === 'max' ? setRef : undefined}
                            size="small"
                            placeholder="Max"
                            value={value?.[1]}
                            onChange={(val) => onChange([value?.[0], val])}
                            onFocus={onFocus}
                            style={{ width: hasNumberValue ? 'calc(50% - 14px)' : '50%' }}
                            controls={false}  // Remove spinner to save space
                        />
                        {hasNumberValue && (
                            <Button
                                size="small"
                                icon={<CloseCircleOutlined />}
                                onClick={() => onChange([null, null])}
                                style={{ width: 28 }}
                            />
                        )}
                    </Space.Compact>
                </div>
            );

        case 'date':
            return (
                <RangePicker
                    ref={setRef}
                    size="small"
                    value={value}
                    onChange={(dates) => onChange(dates)}
                    onFocus={onFocus}
                    style={{ width: '100%' }}
                    format="MM/DD/YYYY"
                    allowClear
                    placeholder={['Start Date', 'End Date']}
                />
            );

        case 'select':
            return (
                <Select
                    ref={setRef}
                    size="small"
                    placeholder="Select..."
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    allowClear
                    style={{ width: '100%' }}
                    options={config.options}
                />
            );

        default:
            return null;
    }
}

// Alternative: Inline editable headers (if you really prefer this approach)
export function InlineFilterTable<T extends Record<string, any>>({
    columns = [],
    filterConfig,
    ...restProps
}: EnhancedTableProps<T>) {
    const [headerMode, setHeaderMode] = useState<Record<string, boolean>>({});
    const [filters, setFilters] = useState<Record<string, any>>({});

    const enhancedColumns = columns.map((col) => {
        const key = col.dataIndex as string;
        const config = filterConfig?.[key];
        const isEditMode = headerMode[key];

        if (!config) return col;

        return {
            ...col,
            title: isEditMode ? (
                <div onClick={(e) => e.stopPropagation()}>
                    {config.type === 'text' && (
                        <Input
                            size="small"
                            autoFocus
                            placeholder={`Filter ${col.title}`}
                            value={filters[key] || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                            onBlur={() => setHeaderMode(prev => ({ ...prev, [key]: false }))}
                            onPressEnter={() => setHeaderMode(prev => ({ ...prev, [key]: false }))}
                            prefix={<SearchOutlined />}
                        />
                    )}
                    {/* Add other input types as needed */}
                </div>
            ) : (
                <div
                    onClick={() => setHeaderMode(prev => ({ ...prev, [key]: true }))}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    {col.title}
                    {filters[key] && <FilterOutlined style={{ marginLeft: 4, color: '#1890ff' }} />}
                </div>
            ),
            // Add filtering logic here
        };
    });

    return <Table {...restProps} columns={enhancedColumns} />;
}

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

// Export updated table styles with the enhanced component
export const enhancedTableStyles = {
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
    filterRow: {
        bordered: true,
        size: 'middle' as const,
        scroll: { x: 'max-content' },
        pagination: {
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total: number) => `Total ${total} items`,
            pageSizeOptions: ['10', '20', '50', '100'],
        },
        className: 'table-with-filters',
    },
};