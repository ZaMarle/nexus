using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

[ApiController]
[Route(".well-known")]
public class WellKnownController(RsaKeyService rsaKeys) : ControllerBase
{
    [HttpGet("jwks.json")]
    public IActionResult Jwks()
    {
        var parameters = rsaKeys.Key.ExportParameters(includePrivateParameters: false);

        return Ok(new
        {
            keys = new[]
            {
                new
                {
                    kty = "RSA",
                    use = "sig",
                    kid = rsaKeys.KeyId,
                    alg = "RS256",
                    n = Base64UrlEncoder.Encode(parameters.Modulus!),
                    e = Base64UrlEncoder.Encode(parameters.Exponent!),
                }
            }
        });
    }
}
