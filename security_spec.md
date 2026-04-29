# Security Specification for Khakhi Path

## 1. Data Invariants
- **User Mistake**: A mistake record must belong to a specific user and contain a valid question object and the user's incorrect answer. Indicated by `keys().size() == 3`.
- **Saved Question**: A saved question must belong to a specific user and reference a valid question. Indicated by `keys().size() == 2`.
- **User Attempt**: A test attempt must be linked to the legitimate user who took the test and have exact fields (size 5).
- **Admin Privileges**: Only verified admin emails (`rajuroyal025@gmail.com`) can modify global questions and current affairs.

## 2. The "Dirty Dozen" Logic Leaks (Hardened)
The following payloads are now explicitly rejected by the security rules:

1.  **Identity Spoofing**: Attempt to create a mistake for another user. (Blocked by `isOwner(userId)`).
2.  **Resource Poisoning**: Create a mistake with a 200KB string as the ID. (Blocked by `isValidId()` string length limit).
3.  **Shadow update**: Attempt to update a question text as a non-admin. (Blocked by `isAdmin()` and `allow update: if false` on many paths).
4.  **Invalid Type**: Set `userAnswer` as a string instead of an integer. (Blocked by `isValidMistake()` type checks).
5.  **Orphaned Writes**: Create a mistake without a question object. (Blocked by `keys().hasAll(['question', ...])`).
6.  **Privilege Escalation**: Bypass `isOwner` check to read someone else's mistakes. (Blocked by `isOwner(userId)`).
7.  **Bypass Admin**: Create current affairs without being an admin. (Blocked by `isAdmin()`).
8.  **Malicious ID**: Use an ID with special characters. (Blocked by `isValidId()` regex).
9.  **Missing Fields**: Create an attempt without a `userId`. (Blocked by `keys().hasAll()`).
10. **Ghost Fields (NEW)**: Send a payload with extra hidden data. (Blocked by `keys().size() == N`).
11. **PII Leak (FIXED)**: Reading other users' profiles via generic `isSignedIn()` rule. (Now strictly `isOwner(userId)`).
12. **Query Scraping**: Listing attempts of other users. (Blocked by `allow list: if resource.data.userId == request.auth.uid`).

## 3. Test Runner (Mock Tests Logic)
The following tests verify the rules:

```ts
// firestore.rules.test.ts (Pseudocode for logic verification)
describe("Firestore Rules", () => {
  it("denies access to mistakes of another user", async () => {
    const db = getTestEnv().authenticatedContext("user_A").firestore();
    await assertFails(getDoc(doc(db, "users/user_B/mistakes/m1")));
  });

  it("denies admin-only writes for regular users", async () => {
    const db = getTestEnv().authenticatedContext("user_A").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), { ... }));
  });

  it("denies mistakes with invalid IDs", async () => {
    const db = getTestEnv().authenticatedContext("user_A").firestore();
    await assertFails(setDoc(doc(db, "users/user_A/mistakes/!!!"), { ... }));
  });
});
```
