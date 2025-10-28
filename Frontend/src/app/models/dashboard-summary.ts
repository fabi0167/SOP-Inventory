export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardSummary {
  totalItemCount: number;
  statusCounts: DashboardStatusCount[];
}
