# React Native Profile Convert CLI

**React Native Profile Convert CLI** is a command-line tool designed to streamline the process of converting Hermes CPU profiles from an Android device or emulator into Chrome-compatible profiles for performance analysis. The tool automates the process of pulling CPU profiles from `adb`, downloading necessary bundles and source maps, and converting the profiles into a format that can be easily analyzed using Chrome DevTools.

## Features

- **Profile Selection:** Interactively select a CPU profile from the Android device or emulator.
- **Automatic Downloading:** Automatically download the corresponding `index.bundle.js` and `index.map` files from a React Native Metro bundler.
- **Profile Conversion:** Convert Hermes CPU profiles into a format compatible with Chrome DevTools for performance analysis.
- **Custom Output Directory:** Save the converted profiles in a specified directory.

## Installation

To use this tool, you can install it globally using npm:

```
npm install -g react-native-profile-convert-cli
```

Or you can run it directly using `npx`:

```
npx react-native-profile-convert-cli
```

## Usage

To use the **React Native Profile Convert CLI**, you first need to launch your React Native app on an Android emulator or device. If your React Native app is unable to load the bundle, you can fix this by running the following command in your terminal:

$$$
adb reverse tcp:8081 tcp:8081
$$$

This command ensures that the app can connect to the Metro bundler running on your development machine.

Once the app is running and the bundle is loading correctly, open the React Native Developer Menu by either shaking the device, pressing `Cmd + M` on the emulator, or by pressing the `d` key in the terminal where Metro is running. From the Developer Menu, select the "Sampling Profiler" option to start profiling. After you've finished profiling, the CPU profile will be saved on your device. You can then use this CLI tool to pull the saved profile, convert it to a Chrome-compatible format, and analyze it for performance optimization.

You can use the CLI tool with the following options:

```
rnpc -p <packageName> -a <appName> -o <outputDirectory>
```

### Options

- `-p, --package <packageName>`: **(Required)** The Android package name of your React Native app.
- `-a, --app <appName>`: **(Required)** The name of your React Native app, used to download the bundle and source map files.
- `-o, --output <outputDirectory>`: **(Required)** The directory where the converted profile should be saved.

### Example

Here is an example command that pulls a CPU profile from the app `com.company.app`, downloads the corresponding bundle and source map, converts the profile, and saves it in the `./output` directory:

```
rnpc -p com.company.app -a com.company.app.debug -o ./output
```

## How It Works

1. **Listing Profiles:** The tool lists all available `.cpuprofile` files from the specified Android package's cache directory.
2. **Profile Selection:** You can select the profile you want to convert through an interactive prompt.
3. **Pulling Profile:** The selected profile is pulled from the Android device or emulator using `adb`.
4. **Downloading Resources:** The tool downloads the `index.bundle.js` and `index.map` files from the specified Metro bundler.
5. **Converting Profile:** The Hermes CPU profile is converted into a Chrome-compatible format using the `hermes-profile-transformer` library.
6. **Saving Output:** The converted profile is saved in the specified output directory.

## Requirements

- **Node.js**: Ensure you have Node.js installed.
- **adb**: The Android Debug Bridge (adb) must be installed and properly configured in your system's PATH.
- **React Native Metro Bundler**: The tool assumes that the Metro bundler is running locally (usually at `http://localhost:8081`).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributions

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request on GitHub.

## Author

Sergei Grigorev
