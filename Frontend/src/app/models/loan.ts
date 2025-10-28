import { Item } from './item';
import { User } from './user';

export interface Loan {
  id: number;
  borrowerId: number;
  approverId: number;
  itemId: number;
  loanDate: Date;
  returnDate: Date;
  borrower?: User;
  approver?: User;
  loanApprover?: User;
  loanItem?: Item;
  // Legacy API fields kept for backward compatibility
  userId?: number;
  loanUser?: User;
}
