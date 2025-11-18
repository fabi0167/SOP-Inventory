export interface ActiveLoanFilters {
  borrowerId?: number | null;
  approverId?: number | null;
  itemId?: number | null;
  search?: string | null;
  loanDateFrom?: string | null;
  loanDateTo?: string | null;
}
