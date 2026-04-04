## Session Title 
Image on report lost card was not updated in real-time
 
### Prompt (you sent to AI)
 
I found that when user create a report, the image cannot be shown instantly in other user view, they need to refresh to get the image, why is that?
 
### AI Response (trimmed if long)
 
The image problem happened because report creation and image upload are two separate calls in ReportLostItem.tsx (line 199). Before this change, other users got the realtime report_created event before the second upload call completed, and there was no follow-up websocket event after the image was saved. So other clients kept showing the report without images until a manual refresh.
 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- It pointed out where the problem was and explained why this bug happened.
- We think everything aligns with our inital thoughts, so nothing incorrect, misleading, nor not applicable.
- We follow the guide, find the mentioned peice of code and validate the logic error. We change the logic in the backend by adding the broadcasting in imageController.ts.
---

## Session Title (e.g., Debugging Docker Compose networking)
 
### Prompt (you sent to AI)
 
<copy/paste>
 
### AI Response (trimmed if long)
 
<copy/paste or summary>
 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- What was useful
- What was incorrect, misleading, or not applicable to your project
- How your team verified, modified, or replaced the suggestion

---

## Session Title (e.g., Debugging Docker Compose networking)
 
### Prompt (you sent to AI)
 
<copy/paste>
 
### AI Response (trimmed if long)
 
<copy/paste or summary>
 
### What Your Team Did With It
 
1-3 bullet points describing:
 
- What was useful
- What was incorrect, misleading, or not applicable to your project
- How your team verified, modified, or replaced the suggestion