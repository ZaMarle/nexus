using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;

public class RsaKeyService
{
    private const string KeyPath = "keys/signing.pem";

    public RSA Key { get; }
    public string KeyId { get; }

    public RsaKeyService()
    {
        if (File.Exists(KeyPath))
        {
            Key = RSA.Create();
            Key.ImportFromPem(File.ReadAllText(KeyPath));
        }
        else
        {
            Key = RSA.Create(2048);
            Directory.CreateDirectory(Path.GetDirectoryName(KeyPath)!);
            File.WriteAllText(KeyPath, Key.ExportRSAPrivateKeyPem());
        }

        KeyId = Convert.ToHexString(SHA256.HashData(Key.ExportSubjectPublicKeyInfo()))[..16].ToLowerInvariant();
    }

    public RsaSecurityKey SecurityKey => new(Key) { KeyId = KeyId };
}
