export interface ArchiveLoan {
  id: number;
  borrowerId: number;
  approverId: number;
  itemId: number;
  loanDate: string;
  returnDate: string;
  deleteTime: Date;
  archiveNote: string;
  userId?: number;
}
