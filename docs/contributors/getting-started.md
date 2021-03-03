# Getting Started

The following guide is for setting up your local environment to contribute to the *Free (as in Speech)* project.

## Development Tools (Node)

*Free (as in Speech)* is a JavaScript project and requires [Node.js](https://nodejs.org/). The project is built using the latest active LTS release of node, and the latest version of NPM. See the [LTS release schedule](https://github.com/nodejs/Release#release-schedule) for details.

We recommend using the [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm) since it is the easiest way to install and manage node for macOS, Linux, and Windows 10 using WSL2.

After installing Node, you can build *Free (as in Speech)* by running the following from within the cloned repository:

```bash
npm ci
npm run build
```

Once built, *Free (as in Speech)* can be loaded in your browser as a development extension!

`npm run build` creates a single build of the project once. While developing, you probably will want to use `npm run watch` to run continuous builds automatically as source files change. The dev build also includes additional warnings and errors to help troubleshoot while developing.

### Browser Environment

Whilst you can run the extension within your normal browser, it's usually better to use a clean browser profile for development. You'll need to have [Chrome](https://www.google.com/chrome/) or [Firefox](https://www.mozilla.org/firefox/new/) installed, you can then start a fresh copy of either of them by running `npm run start:chrome` or `npm run start:firefox`, respectively.

### Command-line environment

If you have a HAR file available, you can also develop from the command-line only. You can directly execute the `bin/export-from-har.js` using node like this:

```bash
node bin/export-from-har.js <exporter> [options] <harfile>
```

This will use the HAR file as a source to fulfill HTTP requests. The script is not capable of making HTTP requests directly. Refer to [Working with the command-line](/docs/contributors/command-line.md).

## Developer Tools

We recommend configuring your editor to automatically check for syntax and lint errors. This will help you save time as you develop by automatically fixing minor formatting issues.

### EditorConfig

[EditorConfig](https://editorconfig.org/) defines a standard configuration for setting up your editor, for example using tabs instead of spaces. Your editor might need an extension to support this. Usually it will automatically configure your editor to according to the rules defined in [.editorconfig](https://github.com/pento/free-as-in-speech/blob/HEAD/.editorconfig).

### ESLint

[ESLint](https://eslint.org/) statically analyzes the code to find problems. The lint rules are integrated in the continuous integration process and must pass to be able to commit.
