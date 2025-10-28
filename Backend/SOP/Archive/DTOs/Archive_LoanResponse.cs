namespace SOP.DTOs
{
    public class Archive_LoanResponse
    {
        public int Id { get; set; }

        public int BorrowerId { get; set; }

        public int ApproverId { get; set; }

        public int ItemId { get; set; }

        public DateTime LoanDate { get; set; }

        public DateTime ReturnDate { get; set; }

        public DateTime DeleteTime { get; set; }

        public string ArchiveNote { get; set; }

        public int UserId
        {
            get => BorrowerId;
            set => BorrowerId = value;
        }
    }
}
