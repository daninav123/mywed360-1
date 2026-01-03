Recommended Firestore indexes for the email system

Global collection `mails` (collection: mails)
- folder Asc, date Desc (for queries filtering by folder and ordering by date)
- folder Asc, to Asc, date Desc (for inbox queries by recipient)
- folder Asc, from Asc, date Desc (for sent queries by sender)

User subcollection (collection group: mails)
- folder Asc, date Desc (for queries on users/{uid}/mails by folder ordered by date)

How to create
- Console: Firestore -> Indexes -> Composite -> Add index
  - For collection group, choose “Collection group” and enter mails
  - Add fields exactly as above

Notes
- Equality filter on folder combined with orderBy(date) requires a composite index.
- If you see “FAILED_PRECONDITION: The query requires an index” in logs, follow the link suggested by Firestore or add the index above.

