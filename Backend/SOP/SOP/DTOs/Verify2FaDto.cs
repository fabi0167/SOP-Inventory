namespace SOP.DTOs
{
    public class Verify2FaDto
    {
        public string Email { get; set; }
        public string Code { get; set; } // The 6-digit OTP from the authenticator app
    }
}
