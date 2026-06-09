public record AuthorizationCode(
    Guid UserId,
    string RedirectUri,
    string CodeChallenge,
    DateTime ExpiresAt
);
