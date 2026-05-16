using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, RsaKeyService rsaKeys, IConfiguration config) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (req.RedirectUrl is not null && !IsAllowedRedirect(req.RedirectUrl))
            return BadRequest(new { message = "Redirect URL not allowed." });

        if (await db.Users.AnyAsync(u => u.Email == req.Email.ToLowerInvariant()))
            return Conflict(new { message = "Email already in use." });

        var user = new User
        {
            Name = req.Name,
            Email = req.Email.ToLowerInvariant(),
            PasswordHash = HashPassword(req.Password),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(new { token = CreateToken(user), user = ToDto(user), redirectUrl = req.RedirectUrl });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        if (req.RedirectUrl is not null && !IsAllowedRedirect(req.RedirectUrl))
            return BadRequest(new { message = "Redirect URL not allowed." });

        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant());

        if (user is null || !VerifyPassword(req.Password, user.PasswordHash))
            return Unauthorized();

        return Ok(new { token = CreateToken(user), user = ToDto(user), redirectUrl = req.RedirectUrl });
    }

    private bool IsAllowedRedirect(string redirectUrl)
    {
        if (!Uri.TryCreate(redirectUrl, UriKind.Absolute, out var uri))
            return false;

        var origin = $"{uri.Scheme}://{uri.Host}:{uri.Port}";
        var allowed = config.GetSection("AllowedRedirectOrigins").Get<string[]>() ?? [];
        return allowed.Contains(origin);
    }

    private string CreateToken(User user)
    {
        var token = new JwtSecurityToken(
            claims: [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("name", user.Name),
            ],
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(rsaKeys.SecurityKey, SecurityAlgorithms.RsaSha256)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 350_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToHexString(hash)}:{Convert.ToHexString(salt)}";
    }

    private static bool VerifyPassword(string password, string stored)
    {
        var parts = stored.Split(':');
        byte[] storedHash = Convert.FromHexString(parts[0]);
        byte[] salt = Convert.FromHexString(parts[1]);
        byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 350_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(storedHash, inputHash);
    }

    private static object ToDto(User user) => new { user.Id, user.Name, user.Email };
}

public record RegisterRequest(string Name, string Email, string Password, string? RedirectUrl);
public record LoginRequest(string Email, string Password, string? RedirectUrl);
