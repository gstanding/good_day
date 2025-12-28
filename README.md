# Good Day - Anniversary & Countdown Tracker

A WeChat Mini Program for tracking anniversaries with Solar and Lunar calendar support.

## Features

*   **Countdown & Count Up**: Track days left to an event or days passed since an event.
*   **Dual Calendar Support**: Full support for both Solar (Gregorian) and Lunar calendars.
*   **Data Persistence**: Local storage ensures your data is saved.
*   **Reminders**: Add upcoming events to your system calendar.
*   **Sharing**: Share event cards with friends.
*   **Customization**: Choose theme colors for different events.

## Setup Instructions

1.  **Open in WeChat DevTools**:
    *   Import this folder into WeChat Developer Tools.
    *   AppID: You can use your own AppID or a test ID.

2.  **Build NPM**:
    *   This project uses `lunar-javascript` for accurate calendar conversion.
    *   In WeChat DevTools, go to **Tools** -> **Build npm**.
    *   This will create a `miniprogram_npm` folder.

3.  **Run**:
    *   Click "Compile" to start the app.

## Project Structure

*   `pages/`: UI pages (Index, Edit, Detail).
*   `utils/`: Helper functions and storage logic.
    *   `util.js`: Date calculations and Lunar conversion.
    *   `storage.js`: Local storage wrapper.
*   `app.js/json/wxss`: Global configuration and styles.

## Notes

*   Ensure your "Local Settings" in DevTools has "Use NPM module" enabled (usually default in newer versions).
*   The "Add to Calendar" feature works best on a real device.
