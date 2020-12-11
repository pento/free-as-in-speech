# Contributing Guidelines

Welcome to WordPress' *Free (as in Freedom)* project! We hope you join us in helping folks free their content from CMSes that try to lock them in; all are welcome here.

## Building and Testing

*Free (as in Freedom)* is built using the current [Node](https://nodejs.org/en/) LTS version, and the latest version of [NPM](https://www.npmjs.com/). The easiest way to install these is with [NVM](https://github.com/nvm-sh/nvm).

Running `npm run watch` will build the extension, and automatically rebuild it when changes are made.

`npm run start:firefox` will open a new Firefox window with a fresh profile, install the extension, and automatically reload it when it rebuilds. `npm run start:chrome` will do the same in Chrome.

## Guidelines

- As with all WordPress projects, we want to ensure a welcoming environment for everyone. With that in mind, all contributors are expected to follow our [Code of Conduct](/CODE_OF_CONDUCT.md).

- All WordPress projects are [licensed under the GPLv2+](/LICENSE.md), and all contributions to Gutenberg will be released under the GPLv2+ license. You maintain copyright over any contribution you make, and by submitting a pull request, you are agreeing to release that contribution under the GPLv2+ license.

## Reporting Security Issues

Please see [SECURITY.md](/SECURITY.md).
