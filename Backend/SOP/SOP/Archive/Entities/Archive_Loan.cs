using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SOP.Entities
{
    public class Archive_Loan
    {
        [Key]
        public int Id { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime DeleteTime { get; set; }

        [Column(TypeName = "int")]
        public int BorrowerId { get; set; }

        private int _approverId;

        [Column(TypeName = "int")]
        public int ApproverId
        {
            get => _approverId == 0 ? BorrowerId : _approverId;
            set => _approverId = value;
        }

        [Column(TypeName = "tinyint")]
        public int ItemId { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime LoanDate { get; set; }

        [Column(TypeName = "datetime")]
        public DateTime ReturnDate { get; set; }

        [Column(TypeName = "nvarchar(255)")]
        public string ArchiveNote { get; set; }

        [NotMapped]
        public int UserId
        {
            get => BorrowerId;
            set => BorrowerId = value;
        }
    }
}
