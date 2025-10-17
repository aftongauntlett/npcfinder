# Future: End-to-End Encryption

## What This Means

End-to-end encryption (E2E) means data is encrypted on your device before sending to the server. Only you can decrypt it with your password.

**Result:** Admin and Supabase cannot read your encrypted data.

## Planned Implementation

### Phase 1: Choose What to Encrypt

Not everything needs E2E encryption. Planned categories:

**Encrypted:**
- Personal notes
- Private journal entries
- Health/fitness data
- Private recommendations

**Not Encrypted (need sharing/search):**
- Public recommendations
- Friend connections
- Suggestion voting
- Media search history

### Phase 2: Technical Approach

Using Web Crypto API (built into browsers):

```typescript
// User's password derives encryption key
const key = await deriveKeyFromPassword(userPassword);

// Encrypt before saving
const encrypted = await encrypt(data, key);
await saveToDatabase(encrypted);

// Decrypt after loading
const encrypted = await loadFromDatabase();
const decrypted = await decrypt(encrypted, key);
```

### Phase 3: User Experience

**Password Management:**
- Master password for encryption
- Cannot be reset (if lost, data is lost forever)
- Separate from login password
- Optional biometric unlock

**Migration:**
- Existing data remains unencrypted
- New sensitive data is encrypted
- Users can opt-in to encrypt old data

## Tradeoffs

### Pros
- Admin cannot read encrypted data
- Supabase cannot read encrypted data
- Maximum privacy for sensitive information

### Cons
- Forget password = lose data forever
- Can't search encrypted data server-side
- Slower (encryption overhead)
- More complex code
- No "forgot password" recovery for encrypted data

## Timeline

Not implemented yet. Planned for future release.

## Technical Challenges

1. **Key Management**
   - Securely derive keys from passwords
   - Handle key rotation
   - Support multiple devices

2. **Sharing Encrypted Data**
   - How to share with friends?
   - Need recipient's public key
   - Complexity increases significantly

3. **Search**
   - Can't search encrypted data
   - Need client-side search only
   - Performance concerns

4. **Backward Compatibility**
   - Existing data is unencrypted
   - Migration strategy needed
   - Support both modes

## Libraries Being Considered

- **Web Crypto API** - Built into browsers
- **@noble/ciphers** - Modern crypto library
- **TweetNaCl** - Lightweight encryption

## Questions?

This is a complex feature with significant tradeoffs. It will be optional - users can choose whether to enable E2E encryption for their sensitive data.

Standard features (recommendations, suggestions) will remain unencrypted to enable sharing and searching.
