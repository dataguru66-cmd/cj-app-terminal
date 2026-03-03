# How to Transfer and Build on a Mac

This folder contains the complete, Xcode-ready codebase for the CJ App.

## Step 1: Extract & Install Dependencies (On the Mac)
1. Drag this extracted folder (Antigravitycjappproj) onto the Mac Desktop if it isn't already there.
2. Open the **Terminal** app on the Mac.
3. Type `cd ` (with a space after it), then drag and drop the `Antigravitycjappproj` folder from the desktop directly into the terminal window and hit Enter. This navigates into the folder.
4. Run this exact command to install the required Node modules:
   `npm install`
*(Note: If you don't have Node.js installed on the Mac, you will need to download and install it quickly from nodejs.org first).*

## Step 2: Open in Xcode
1. **CRITICAL:** Do not open the folder directly in Xcode. 
2. Open the Xcode application itself.
3. Go to **File > Open**.
4. Navigate inside the `Antigravitycjappproj` folder to: `ios / App / App.xcworkspace`. Select **App.xcworkspace** and click Open. *(Opening the .xcworkspace instead of the .xcodeproj is required for Capacitor).*

## Step 3: Sign and Upload to TestFlight
1. In Xcode, click the **App** icon at the very top of the left navigational sidebar.
2. In the main window area, select the **Signing & Capabilities** tab.
3. Check the box for "**Automatically manage signing**".
4. From the **Team** dropdown, select your Apple Developer account (you may need to click "Add Account..." and sign in with the Apple ID credentials).
5. Ensure the target device drop-down at the top middle of the Xcode window is set to "**Any iOS Device (arm64)**".
6. In the very top menu bar of the Mac screen, click **Product > Archive**.
7. Xcode will take a minute or two to compile the application. When it finishes, an Organizer window will pop up. 
8. Click the blue **Distribute App** button on the right side.
9. Select **TestFlight & App Store** and follow the prompts.

Within 5 to 10 minutes, the build will finish processing on Apple's servers and will be available in your App Store Connect account to release to testers!
