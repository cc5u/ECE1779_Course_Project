Create a modern, clean "Report Detail" page UI for a cloud-native lost-and-found web application called "FindIt". This page displays full information about a specific lost item report, shows its location on a map, and allows users to communicate and upload possible sightings.

Overall layout:

* Desktop-first design (1440px width).
* Clean, professional SaaS-style interface similar to Airbnb, Google Maps side panels, or Notion.
* Light theme with white background, subtle gray dividers, and blue primary accent color.
* Use Inter or Roboto font.
* Use an 8px spacing grid and rounded corners (8–12px radius).

Top navigation bar:

* Same consistent navbar as other pages.
* Left side: logo icon and text "FindIt".
* Right side: "Home", "Report Lost Item", and user avatar placeholder.
* Fixed position with subtle shadow.

Main layout structure:

* Split layout with two main sections:

  * Left side: Map section (60% width)
  * Right side: Information and interaction panel (40% width)

Left section: Map view

* Large map container placeholder filling full height.
* Show a map pin marker indicating lost location.
* Show a semi-transparent circular radius around the pin.
* Include zoom controls and map UI placeholders.
* Include small overlay text at top-left of map: "Lost location".

Right section: Report detail panel
Scrollable vertical panel containing:

Top section: Item summary

* Large item title (e.g., "Black Leather Wallet")
* Status badge next to title:

  * Examples: "Lost" (red), "Possibly Found" (orange), "Found" (green)
* Lost date and time
* Lost location text (e.g., "Union Station, Toronto")
* Owner name or anonymous label

Image section:

* Large image placeholder showing item photo
* Below image, show smaller thumbnails if multiple images exist

Description section:

* Section title: "Description"
* Paragraph text describing item details

Possible sightings section:

* Section title: "Possible Sightings"
* Display 1–2 example sighting cards
* Each card includes:

  * uploader avatar placeholder
  * uploaded image thumbnail
  * short note text
  * timestamp

Action buttons section:

* If viewer is NOT owner:

  * Primary button: "I Found This Item" (blue)
  * Secondary button: "Send Message"
* If viewer IS owner:

  * Primary button: "Mark as Found" (green)
  * Secondary button: "Edit Report"

Chat section:

* Section title: "Messages"
* Chat container showing conversation messages in bubbles
* Show both sender and receiver message styles
* Include timestamp below messages
* At bottom: message input field and Send button

Visual and UX details:

* Clear visual hierarchy and section separation
* Use cards with soft shadows for sightings and chat
* Proper spacing and alignment
* Clean, modern SaaS interface
* Use reusable components and auto layout

Deliverable:

* One complete desktop frame showing the full report detail page
* Organized components and clean layout structure
