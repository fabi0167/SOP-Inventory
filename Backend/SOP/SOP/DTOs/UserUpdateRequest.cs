namespace SOP.DTOs
{
    public class UserUpdateRequest
    {
        public int? RoleId { get; set; }  // Optional update

        public string? Name { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? Password { get; set; }  // Optional, handled separately

        public bool? TwoFactorAuthentication { get; set; }

        public string? ProfileImageUrl { get; set; }
    }
}
