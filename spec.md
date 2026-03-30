# Salad Khatora

## Current State
Full-stack ICP app with Motoko backend. Leads feature was previously removed entirely from both frontend and backend for stability.

## Requested Changes (Diff)

### Add
- `leads` collection in backend persistent storage
- `Lead` type with fields: id (Text), name (Text), mobile (Text), date (Int), status (LeadStatus variant: new | contacted | converted)
- `LeadStatus` variant type
- `createLead(name: Text, mobile: Text)` — generates unique ID, timestamps with current time, stores with status #new
- `getLeads()` — returns all leads, no auth restriction (admin callable)
- `updateLeadStatus(id: Text, status: LeadStatus)` — updates status for a lead by ID

### Modify
- `main.mo` — add leads stable storage, Lead type, LeadStatus type, and the three functions

### Remove
- Nothing

## Implementation Plan
1. Add `LeadStatus` variant and `Lead` record type to backend
2. Add `stable var leads : [(Text, Lead)]` storage using a HashMap backed by stable array
3. Implement `createLead`, `getLeads`, `updateLeadStatus`
4. No frontend changes — backend only
