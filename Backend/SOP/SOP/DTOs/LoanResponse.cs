namespace SOP.DTOs
{
    public class LoanResponse
    {
        public int Id { get; set; }

        public int BorrowerId { get; set; }

        public int ApproverId { get; set; }

        public int ItemId { get; set; }

        public DateTime LoanDate { get; set; }

        public DateTime ReturnDate { get; set; }

        private LoanUserResponse? _loanBorrower;

        public LoanUserResponse? LoanBorrower
        {
            get => _loanBorrower;
            set => _loanBorrower = value;
        }

        public LoanUserResponse? LoanApprover { get; set; }

        public LoanUserResponse? LoanUser
        {
            get => _loanBorrower;
            set => _loanBorrower = value;
        }

        public int UserId
        {
            get => BorrowerId;
            set => BorrowerId = value;
        }

        public LoanItemResponse LoanItem { get; set; }
    }

    public class LoanUserResponse
    {
        public int Id { get; set; }

        public int RoleId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public bool TwoFactorAuthentication { get; set; }
    }

    public class LoanItemResponse
    {
        public int Id { get; set; }

        public int RoomId { get; set; }

        public int ItemGroupId { get; set; }

        public string SerialNumber { get; set; } = string.Empty;
    }
}
