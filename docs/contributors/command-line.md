# Working with the Command-line

The command-line script `bin/export-from-har.js` can be a convenient way to iterate quickly if you have previously saved a [HAR file](https://en.wikipedia.org/wiki/HAR_\(file_format\)) as the source to fulfill the HTTP requests the extension would normally make in the browser using your credentials.

## Creating a HAR file

The developer tools of modern browsers offer a section called _Network_ which will list all the network requests the browser made in order to display the associated tab in the browser.

This list of requests can be saved as a HAR file:

- In Firefox, click on any request in the list (or the cog-wheel on the top right) and select the option _Save All As HAR_. It will prompt you where to save the HAR file.
- In Chrome, click on any request in the list and select the option _Save all as HAR with content_. It will prompt you where to save the HAR file.

The resulting file is a text file with JSON content. You can now use this to work with the command-line.

**Warning: the HAR file might contain private information. You can use the [anonymize-har.js](/packages/fetch-from-har/bin/anonymize-har.js) tool to anonymize it before sharing.**

Tools like [Charles proxy](https://www.charlesproxy.com/) can be used to manipulate HAR files with a UI.

### How to get the right requests for a HAR file

There are two main strategies to retrieve the requests for your development work:

#### Exploratory use by browsing

If you enable the option _Persist logs_ (Firefox, in the cog-wheel menu in the Network tab) or _Preserve logs_ (Chrome, a checkbox at the top of the Network tab), the requests in the network tab will accumulate until you use the trash icon on the top left.

This allows to gather larger amounts of HTTP requests that can serve as a repository of requests to be used later in development.

Now save the HAR file as described above.

#### Saving the specific requests the extension already makes

By opening an inspect window specifically for the extension, you can just save the specific set of requests the extension already makes in its normal operation:

- In Firefox, go to the URL `about:addons` (or use the _Tools_ menu and select _Add-ons_), click the cog-wheel and select _Debug Add-ons_ from the dropdown. Now find the _Free as in Speech_ extension and click the _Inspect_ button.
- In Chrome, go to the URL `chrome://extensions` (or use the _Window_ menu and select _Extensions_), toggle the _Developer Mode_ on the top right. Now find the _Free as in Speech_ extension and click the _background page_ link_.

Then, run the extension once as normal in the browser, i.e. click the extension button the desired website.

Now return to the network tab of the inspector window and save the HAR file as described above.

## Running an extraction

We have a CLI script called [export-from-har.js](/bin/export-from-har.js) which can be executed like this:

```bash
node bin/export-from-har.js <exporter> [options] <harfile> <wxrfile>
```

You can see the available exporters in the help screen:

```bash
node bin/export-from-har.js -h
```

The script will run the same code that is run in the browser extension but uses the requests and responses stored in the HAR file to fulfill the `fetch()` requests in the code. It writes the WXR to the specified WXR filename.

This allows you to test your code changes to the extraction process with different HAR files quickly. It also means that you can do development offline, without having to use a browser, given you have the required HTTP requests covered.

The package [fetch-from-har](/packages/fetch-from-har/README.md) is used in the background to use the HAR file as a source. It is invoked with a predefined callbacks to offer reasonable fallbacks per extractor.
