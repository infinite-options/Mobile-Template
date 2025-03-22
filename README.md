# IO-Login-Google

Google Login Demo

- Works in React Native on both iOS and Android
- Demonstrates Google Login - Demonstrates Google Maps
- Requires keystore file for proper Android deployment
- Use npx expo start --clear to speed interations between builds. It does not build the app for Android or iOS directly. It just starts the project for development purposes.

To Run Project after downloading from GitHub
(The trickiness comes from getting the variable from the .env file.

- app.config.js must get the variables from dotenv
- all other files must get the variables from react-native-dotenv)

- Download from git
- Copy .env file
- npm install
- change hard coded project ID in app.config.js (if necessary)
- if no eas.json file then: npx eas build:configure (configure for All)
- if no ios or android folder then: npx expo prebuild (may run automatically run if you forget and run npx expo run)
- check gradle.properties to hardcode MAPS_API_KEY and set newArchEnabled=false
- ensure keystore file is accessible in android > app folder
- copy Info.plist file into iOS > GoogleAuthDemo folder
- change hard coded Reverse Google URL if necessary
- npx expo run (npx expo start won't work since IO-Google-Login is configured as an iOS and Android App)
  npx expo start ==> for running apps in React Native using Expo Go, Simulators OR Devices
  npx expo run ==> for running native apps (ie in iOS or Android)

Required Changes for Android Deployment

- After modifying files run: cd android ./gradlew clean cd .. before running npx expo run
- Modify the following files:

0. .env

- activate Client Ids and Keystore variables for appropriate project
- check console log statements during build to confirm env variables are passed correctly

1. app.json (change only if not automatically changed by env file)

- change name (see env file for example)
- change slug (see env file for example)
- change bundle identifier
- change package
- change scheme
- change projectID (generated at expo build?)

2. AndroidManifest.xml

- change android:scheme settings (maybe up to 3 instances)
- change Maps API Key

3. build.gradle (in android>apps)

- change namespace (MUST BE HARDCODED AND CHANGED MANUALLY)
- change applicationId (Currently set to namespace so should be updated automatically)
- ensure KEYSTORE_PATH points to location of keystore file (ie MMU.keystore should be in root folder or android>app)
- location of keystore file determines if you are using a default keystore file or a custom file
- See Creating Keystore Files and Generating SHA-1 in Creating a React Native App document
- Keystore File should be on shared drive

4. MainActivity.kt (in src>main>java)

- change package

5. MainApplication.kt (in src>main>java)

- change package

# Modify android>app>build.gradle

    paste debug.keystore (or whichever keystore file is being using in android>app> folder)

    // print statements to ensure correct variables are being passed from .env file
    println "KEYSTORE_PATH: " + System.getenv("KEYSTORE_PATH")
    println "KEYSTORE_PASS: " + System.getenv("KEYSTORE_PASS")
    println "KEY_ALIAS: " + System.getenv("KEY_ALIAS")
    println "KEY_PASS: " + System.getenv("KEY_PASS")

    // signingConfigs to use .env variable.
    signingConfigs {
        debug {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "$rootDir/../.android/debug.keystore")
            storePassword System.getenv("KEYSTORE_PASS") ?: "android"
            keyAlias System.getenv("KEY_ALIAS") ?: "androiddebugkey"
            keyPassword System.getenv("KEY_PASS") ?: "android"
        }
    }

    // ALTERNATIVELY.  This was the original signingConfig.
    // signingConfigs {
    //     debug {
    //         storeFile file('debug.keystore')
    //         storePassword 'android'
    //         keyAlias 'androiddebugkey'
    //         keyPassword 'android'
    //     }
    // }

Required Changes for iOS Deployment

1. Verify Info.plist has correct Reverse Google URL
2. Check where Maps ID is hard coded
3. Check where Project ID is hard coded
