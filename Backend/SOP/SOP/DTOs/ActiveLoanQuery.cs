using System;

namespace SOP.DTOs
{
    public class ActiveLoanQuery
    {
        public int? BorrowerId { get; set; }
        public int? ApproverId { get; set; }
        public int? ItemId { get; set; }
        public DateTime? LoanDateFrom { get; set; }
        public DateTime? LoanDateTo { get; set; }
        public string? Search { get; set; }
    }
}
