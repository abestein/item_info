// src/config/theme.ts
import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

// Dark theme configuration
export const darkThemeConfig: ThemeConfig = {
    algorithm: theme.darkAlgorithm,
    token: {
        // Primary color
        colorPrimary: '#1890ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        colorInfo: '#1890ff',

        // Dark backgrounds
        colorBgContainer: '#141414',
        colorBgElevated: '#1f1f1f',
        colorBgLayout: '#0a0a0a',

        // Text colors
        colorText: '#e6e6e6',
        colorTextSecondary: '#a6a6a6',
        colorBorder: '#303030',

        // Typography
        fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        fontSize: 14,
        fontSizeLG: 16,
        fontWeightStrong: 600,

        // Spacing
        padding: 16,
        paddingLG: 24,
        margin: 16,
        marginLG: 24,

        // Border
        borderRadius: 6,
        borderRadiusLG: 8,

        // Shadow
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
    },
    components: {
        Layout: {
            bodyBg: '#0a0a0a',
            headerBg: '#141414',
            siderBg: '#141414',
        },
        Menu: {
            darkItemBg: '#141414',
            darkItemSelectedBg: '#1890ff',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
        },
        Table: {
            headerBg: '#1f1f1f',
            rowHoverBg: '#262626',
            borderColor: '#303030',
        },
        Card: {
            colorBgContainer: '#141414',
        },
        Button: {
            primaryShadow: '0 2px 8px rgba(24, 144, 255, 0.25)',
        },
        Input: {
            colorBgContainer: '#1f1f1f',
            colorBorder: '#303030',
        },
    },
};

// Light theme configuration (matching your current design)
export const lightThemeConfig: ThemeConfig = {
    token: {
        // Primary color (keeping your blue)
        colorPrimary: '#1890ff',

        // Typography
        fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        fontSize: 14,
        fontWeightStrong: 600,

        // Border radius
        borderRadius: 6,

        // Shadows
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.1)',
    },
    components: {
        Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#fff',
            siderBg: '#fff',
        },
        Menu: {
            itemBg: '#fff',
            itemSelectedBg: '#e6f7ff',
            itemHoverBg: '#f5f5f5',
        },
        Table: {
            headerBg: '#fafafa',
            rowHoverBg: '#f5f5f5',
        },
    },
};