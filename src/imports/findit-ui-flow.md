Create a complete desktop UI flow and clickable prototype for a cloud-native lost-and-found web application called "FindIt". The design should be modern, clean, and production-quality, similar to Airbnb, Google Maps, or Uber.

Use a desktop frame width of 1440px. Use Inter or Roboto font. Use a light theme with white background, subtle gray borders, soft shadows, and blue as the primary accent color. Follow an 8px spacing system and use rounded corners (8–12px radius). Use reusable components and auto layout.

Design the following screens and connect them into a logical user flow:

SCREEN 1: Home Page (Map Overview)
Purpose: allow users to browse lost item reports on a map.

Layout:

* Fixed top navigation bar with logo "FindIt" on left, and "Report Lost Item", "Login", and user avatar on right.
* Main layout split into:

  * Left side (70%): large map container showing pins and circular radius indicators.
  * Right side (30%): sidebar labeled "Recent Lost Reports".
* Sidebar contains stacked report cards. Each card includes:

  * item thumbnail
  * item name
  * location
  * time ago
  * status badge (Lost, Possibly Found, Found)
* Floating action button "+" labeled "Report" at bottom-right of map.

Interactions:

* Clicking "Report Lost Item" or floating "+" navigates to Report Lost Item page.
* Clicking a report card navigates to Report Detail page.

SCREEN 2: Report Lost Item Form Page
Purpose: allow users to submit a lost item report.

Layout:

* Same navbar as Home Page.
* Centered form card container (max width 800px).
* Form fields:

  * Item Name (text input)
  * Description (textarea)
  * Lost Date and Time (date and time picker)
  * Search location input field
  * Map container where user selects location with pin and radius
  * Radius slider (50–1000 meters)
  * Upload image area with drag-and-drop box
* Bottom action buttons:

  * Primary button: "Submit Report"
  * Secondary button: "Cancel"

Interactions:

* Clicking Submit navigates to Report Detail page (newly created report).
* Clicking Cancel navigates back to Home Page.

SCREEN 3: Report Detail Page
Purpose: display full report information and allow interactions.

Layout:

* Split layout:

  * Left side (60%): map container with pin and radius circle
  * Right side (40%): scrollable detail panel

Detail panel sections:

* Item title and status badge
* Lost date/time and location
* Item image display
* Description text
* Possible sightings section with sighting cards
* Action buttons:

  * "I Found This Item"
  * "Send Message"
  * If owner: "Mark as Found"

Interactions:

* Clicking "I Found This Item" opens Upload Found Item modal.
* Clicking "Send Message" scrolls to chat section.

SCREEN 4: Upload Found Item Modal
Purpose: allow users to upload evidence of found item.

Layout:

* Modal dialog centered on screen.
* Fields:

  * Upload image drag-and-drop box
  * Optional note textarea
* Buttons:

  * "Submit"
  * "Cancel"

Interaction:

* Clicking Submit closes modal and adds a new sighting card to Report Detail page.

SCREEN 5: Chat Interface (within Report Detail page)
Purpose: allow finder and owner to communicate.

Layout:

* Chat message container with scrollable message list
* Message bubbles aligned left/right
* Message input field and Send button at bottom

Interaction:

* Sending message adds message bubble to chat.

SCREEN 6: Status Update Confirmation
Purpose: owner marks item as found.

Layout:

* Confirmation modal dialog:

  * Message: "Mark this item as found?"
  * Buttons: Confirm (green), Cancel

Interaction:

* Confirm updates status badge to "Found"

Prototype flow connections:

* Home Page → Report Lost Item Page
* Home Page → Report Detail Page
* Report Lost Item Page → Report Detail Page (after submit)
* Report Detail Page → Upload Found Item Modal
* Report Detail Page → Chat interaction
* Report Detail Page → Status Update Confirmation
* Confirmation → back to Report Detail Page with updated status

Components:
Create reusable components for:

* Navbar
* Report card
* Buttons
* Status badge
* Chat bubble
* Form input fields
* Modal dialog

Deliverables:

* Separate frames for each screen
* Connected prototype links between screens
* Organized components and auto layout
* Clean, modern, production-quality UI suitable for a real cloud application
