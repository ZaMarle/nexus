using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("oauth")]
public class OAuthController(AuthorizationCodeStore codeStore, AppDbContext db) : ControllerBase
{
    [HttpPost("token")]
    public async Task<IActionResult> Token(TokenRequest req)
    {
        if (req.GrantType != "authorization_code")
            return BadRequest(new { error = "unsupported_grant_type" });

        var entry = codeStore.Consume(req.Code);
        if (entry is null || entry.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { error = "invalid_grant" });

        if (entry.RedirectUri != req.RedirectUri)
            return BadRequest(new { error = "invalid_grant" });

        var challenge = Base64UrlEncode(SHA256.HashData(Encoding.ASCII.GetBytes(req.CodeVerifier)));
        if (challenge != entry.CodeChallenge)
            return BadRequest(new { error = "invalid_grant" });

        var user = await db.Users.FindAsync(entry.UserId);
        if (user is null)
            return BadRequest(new { error = "invalid_grant" });

        return Ok(new { id = user.Id, name = user.Name, email = user.Email });
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}

public record TokenRequest(string GrantType, string Code, string RedirectUri, string ClientId, string CodeVerifier);
