using System.ComponentModel.DataAnnotations;

namespace SOP.DTOs
{
    public class LoanRequest
    {
        [Required]
        public int BorrowerId { get; set; }

        [Required]
        public int ApproverId { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        public DateTime LoanDate { get; set; }

        [Required]
        public DateTime ReturnDate { get; set; }

        public int UserId
        {
            get => BorrowerId;
            set => BorrowerId = value;
        }
    }
}
