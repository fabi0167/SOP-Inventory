using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SOP.Entities
{
    public class Loan
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey(nameof(Borrower))]
        public int BorrowerId { get; set; }

        private int _approverId;

        [ForeignKey(nameof(Approver))]
        public int ApproverId
        {
            get => _approverId == 0 ? BorrowerId : _approverId;
            set => _approverId = value;
        }

        [ForeignKey("Item.Id")]
        public int ItemId { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime LoanDate { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime ReturnDate { get; set; }

        public Item Item { get; set; }

        public User Borrower { get; set; }

        public User Approver { get; set; }

        [NotMapped]
        public int UserId
        {
            get => BorrowerId;
            set => BorrowerId = value;
        }
    }
}
