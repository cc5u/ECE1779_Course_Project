Create a modern, clean "Report Lost Item" form page UI for a cloud-native lost-and-found web application called "FindIt". This page allows users to submit a lost item report by entering item details and selecting a location on a map.

Overall layout:

* Desktop-first design (1440px width).
* Minimal, professional aesthetic similar to Google Forms, Airbnb, or Uber.
* Light theme with white background, soft gray borders, and blue primary accent color.
* Use clean sans-serif font such as Inter or Roboto.
* Follow an 8px spacing grid system.

Top navigation bar:

* Same navbar as homepage.
* Left side: logo icon and text "FindIt".
* Right side: "Home", "Report Lost Item" (highlighted active state), and user profile avatar placeholder.
* Fixed header with subtle shadow.

Main content layout:

* Centered form container with max width around 800px.
* Use card-style container with white background, rounded corners (12px), and soft shadow.

Form title and description:

* Title: "Report a Lost Item"
* Subtitle text: "Provide details about your lost item so others can help you find it."

Form fields (stacked vertically with proper spacing):

1. Item Name (required)

* Single-line text input
* Placeholder: "e.g., Black leather wallet"

2. Description (required)

* Multi-line textarea
* Placeholder: "Provide additional details such as brand, color, or identifying features"

3. Lost Date and Time (required)

* Date picker and time picker input fields side by side

4. Lost Location (required)

* Interactive map container placeholder
* Large rectangular map area (about 400px height)
* Include instruction text above map: "Click on the map to mark where the item was lost"
* Show a sample pin marker and circular radius indicator on map

5. Search Location input

* Text input above map labeled "Search location"
* Placeholder: "Enter address or place"

6. Approximate Area Radius

* Slider input labeled "Search radius"
* Range from 50m to 1000m
* Show current value (e.g., "200 meters")

7. Upload Image (optional)

* File upload area with dashed border
* Drag and drop style box
* Text: "Upload a photo of the item (optional)"
* Include image preview placeholder

Form actions at bottom:

* Primary button: "Submit Report" (blue, large, prominent)
* Secondary button: "Cancel" (gray or outline style)
* Buttons aligned to the right

UX and visual style:

* Clear visual hierarchy
* Rounded corners (8–12px radius)
* Soft shadows on form container
* Proper spacing between fields
* Required fields marked with *
* Clean and modern form design similar to production SaaS apps

Components:

* Use reusable components for input fields, buttons, map container, and upload area
* Use auto layout and proper constraints

Deliverable:

* One complete desktop frame showing the full Report Lost Item form page
* Well-organized layers and reusable components
