import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Log for debugging
console.log('Dashboard Service using API:', API_BASE_URL);

interface DashboardSummaryResponse {
    summary: {
        totalItems: number;
        approvedItems: number;
        approvalPercentage: number;
        excludedItems: number;
        itemsWithIssues: number;
    };
    barryIssues: Array<{
        issue_type: string;
        count: number;
    }>;
    systemSummary: any;
    excludedBreakdown: Array<{
        Exclusion_Reason: string;
        ItemCount: number;
    }>;
}

interface TableParams {
    page: number;
    pageSize: number;
    searchTerm?: string;
    issueType?: string;
    exclusionReason?: string;
    system?: string;
}

interface TableResponse {
    data: any[];
    totalCount: number;
}

class DashboardService {
    async getDashboardSummary(): Promise<DashboardSummaryResponse> {
        const response = await axios.get(`${API_BASE_URL}/dashboard/summary`);
        return response.data;
    }

    async getBarryListIssues(params: TableParams): Promise<TableResponse> {
        const response = await axios.get(`${API_BASE_URL}/dashboard/barry-issues`, { params });
        return response.data;
    }

    async getExcludedItems(params: TableParams): Promise<TableResponse> {
        const response = await axios.get(`${API_BASE_URL}/dashboard/excluded-items`, { params });
        return response.data;
    }

    async getSystemConflicts(params: TableParams): Promise<TableResponse> {
        const response = await axios.get(`${API_BASE_URL}/dashboard/system-conflicts`, { params });
        return response.data;
    }

    async exportTableData(type: string, filters: any): Promise<Blob> {
        const response = await axios.get(`${API_BASE_URL}/dashboard/export/${type}`, {
            params: filters,
            responseType: 'blob',
        });
        return response.data;
    }
}

export const dashboardService = new DashboardService();