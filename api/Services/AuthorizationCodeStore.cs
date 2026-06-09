using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

public class AuthorizationCodeStore(IMemoryCache cache)
{
    public string Create(Guid userId, string redirectUri, string codeChallenge)
    {
        var code = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        cache.Set(code, new AuthorizationCode(userId, redirectUri, codeChallenge, DateTime.UtcNow.AddSeconds(60)), TimeSpan.FromSeconds(60));
        return code;
    }

    public AuthorizationCode? Consume(string code)
    {
        if (!cache.TryGetValue(code, out AuthorizationCode? entry))
            return null;
        cache.Remove(code);
        return entry;
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
