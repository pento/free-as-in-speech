# WXR

This is a package for generating a WordPress Export (WXR) file.

## Installation

Install the module

```bash
npm install @wordpress/wxr --save-dev
```

## Usage

```js
/**
 * WordPress dependencies
 */
import { getWXRDriver } from '@wordpress/wxr';

const myExporter = async () => {
	const wxr = await getWXRDriver( '1.2' );
};
```

## API

### `getWXRDriver( wxrVersion )`

Retrieves a driver for generating WXR of the passed version. Currently supports version 1.2.

## WXR Driver API

### `wxr.clear()`

Clears the intermediary data store used when generating a WXR file. Should usually be called once,
immediately before starting to add data to the export.

### `wxr.export()`

Returns the full WXR file as a string.

### `wxr.stream( writableStream )`

When generating large WXR files, it may be preferable to limit memory usage by streaming the WXR content,
instead. The WXR will be written to the passed `WritableStream` object.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
