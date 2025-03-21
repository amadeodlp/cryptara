namespace FinanceSimplified.Models;

public class LoginResponse
{
    public UserDto User { get; set; } = new UserDto();
    public string Token { get; set; } = string.Empty;
}

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
