// src/config/theme.ts
import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

// Dark theme configuration
export const darkThemeConfig: ThemeConfig = {
    algorithm: theme.darkAlgorithm,
    token: {
        // Primary color
        colorPrimary: '#043168',
        colorSuccess: '#28a745',
        colorWarning: '#ffc107',
        colorError: '#dc3545',
        colorInfo: '#043168',

        // Dark backgrounds
        colorBgContainer: '#141414',
        colorBgElevated: '#1f1f1f',
        colorBgLayout: '#0a0a0a',

        // Text colors
        colorText: '#e6e6e6',
        colorTextSecondary: '#a6a6a6',
        colorBorder: '#303030',

        // Typography
        fontFamily: `'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        fontSize: 14,
        fontSizeLG: 16,
        fontWeightStrong: 600,

        // Spacing
        padding: 16,
        paddingLG: 24,
        margin: 16,
        marginLG: 24,

        // Border
        borderRadius: 8,
        borderRadiusLG: 10,

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
            darkItemSelectedBg: '#043168',
            darkItemHoverBg: 'rgba(4, 49, 104, 0.3)',
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
            primaryShadow: '0 2px 8px rgba(4, 49, 104, 0.25)',
        },
        Input: {
            colorBgContainer: '#1f1f1f',
            colorBorder: '#303030',
        },
    },
};

// Light theme configuration (matching login page design)
export const lightThemeConfig: ThemeConfig = {
    token: {
        // Primary color (matching login page)
        colorPrimary: '#043168',
        colorSuccess: '#28a745',
        colorWarning: '#ffc107',
        colorError: '#dc3545',
        colorInfo: '#043168',

        // Typography
        fontFamily: `'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        fontSize: 14,
        fontWeightStrong: 600,

        // Background colors
        colorBgContainer: '#ffffff',
        colorBgLayout: '#DFDFE1',
        colorBorder: '#c5c5c7',

        // Border radius
        borderRadius: 8,
        borderRadiusLG: 10,

        // Shadows
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.1)',
    },
    components: {
        Layout: {
            bodyBg: '#DFDFE1',
            headerBg: '#fff',
            siderBg: '#fff',
        },
        Menu: {
            itemBg: '#fff',
            itemSelectedBg: 'rgba(4, 49, 104, 0.1)',
            itemHoverBg: 'rgba(4, 49, 104, 0.05)',
        },
        Table: {
            headerBg: '#DFDFE1',
            rowHoverBg: 'rgba(4, 49, 104, 0.05)',
            borderColor: '#c5c5c7',
        },
        Button: {
            primaryShadow: '0 4px 12px rgba(4, 49, 104, 0.2)',
        },
        Input: {
            colorBorder: '#c5c5c7',
        },
    },
};