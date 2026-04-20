# Firestore Security Specification

## Data Invariants
1. **User Integrity**: Users can only read and write their own profile.
2. **Client Isolation**: Clients must belong to a specific `userId`, which must match the authenticated user.
3. **Appointment Validity**: Appointments must have a `userId` matching the creator and a `clientId` that belongs to that same `userId`.
4. **Public Profile Readability**: Anyone can read a public profile, but only the owner can write it.

## The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing (User)**: Create `users/attacker_id` with `userId: 'victim_id'`.
2. **Identity Spoofing (Client)**: Create `clients/some_id` with `userId: 'victim_id'`.
3. **State Shortcutting**: Update `appointments/id` with `status: 'confirmed'` without payment (only system/payout should allow this, or specifically defined logic).
4. **Massive ID poisoning**: Create `appointments/` followed by a 2KB string as the document ID.
5. **PII Leak**: Authenticated user trying to `get` `users/victim_id`.
6. **Shadow Update**: Add `isVerified: true` to a `User` profile update.
7. **Cross-User Sync**: Update `appointments/id` with a `clientId` belonging to another user.
8. **Resource Exhaustion**: Send an array of 5000 tags in a `User` profile.
9. **Timestamp Spoofing**: Provide a `createdAt` from 2010.
10. **Admin Escalation**: Attempt to set `user.role: 'admin'`.
11. **Malicious Enum**: Set `subscriptionPlan: 'god_mode'`.
12. **Blanket Query**: `list` all clients without a `where` clause.

## Test Runner Logic
The tests verify that all the above payloads return `PERMISSION_DENIED`.
