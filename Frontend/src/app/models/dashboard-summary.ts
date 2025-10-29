export interface DashboardStatusCount {
  status: string;
  count: number;
}

export interface DashboardSummary {
  totalItemCount: number;
  statusCounts: DashboardStatusCount[];
  borrowedItemCount: number;
  nonFunctionalItemCount: number;
  activeLoanCount: number;
}
