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

## Local Environment

Whilst you can run the extension within your normal browser, it's usually better to use a clean browser profile for development. 
With [Chrome](https://www.google.com/chrome/) or [Firefox](https://www.mozilla.org/firefox/new/) installed, create a `.test/web-ext-profile` directory at the root of this repository checkout.

You can then start a fresh copy of either of them by running `npm run start:chrome` or `npm run start:firefox`, respectively.
