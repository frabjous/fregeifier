
# The Amazing Fregeifier

## Introduction

The Fregeifier is a collection of tools for rendering unusual mathematics in documents and webpages, including things such Gottlob Frege’s logical notation or that of Russell and Whitehead’s *Principia Mathematica*. It is not limited to those, but may be used for any other kind of complex or unusual mathematical symbolism/notation for which LaTeX tools already exist, but are otherwise hard to use outside of LaTeX-produced documents.

Possibly more will come, but currently there are two main tools.

1) A filter for [pandoc](https://pandoc.org) that allows you to select a subset of LaTeX-encoded mathematics in a markdown document, which, when converted to a non-LaTeX format, such as `.docx`, `.html` or `.epub`, will be rendered as (scalable) images created by converting the output of processing the mathematics by means of a full-featured LaTeX engine. Hence, you can leverage existing tools for things like Frege’s notation, and other LaTeX goodies.

  The filter was originally developed for [The Journal for the History of Analytical Philosophy](https://jhaponline.org) and integrates easily with the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) and [Open Guide Editor](https://github.com/frabjous/open-guide-editor) it uses, which I also created, though it may be used independently.

2) A web interface that can be used to create, preview and download (scalable) images stemming from arbitrary LaTeX code, including that which makes use of unusual packages such as the [grungesetze](https://ctan.org/pkg/grundgesetze?lang=en) or [fge](https://ctan.org/pkg/fge) packages for Frege’s notation, the [principia](https://ctan.org/pkg/principia?lang=en) package for Russell and Whitehead’s, or any other LaTeX packages available in TeXlive.

  A live, hopefully working, version of the web interface can be found here: [https://russellguide.org/fregeifier](https://russellguide.org/fregeifier).

## Note on branches

The Fregeifier git repo has two branches, one using php for the backend code and filter, and another using server-side (NodeJS) javascript. The former is the 'php' branch and the latter is the 'main' branch. You are viewing the documentation for the **main** (javascript) branch. Checkout the [documentation for the php branch](https://github.com/frabjous/fregeifier/blob/php/README.md) if you would prefer the php version.

## Requirements

The Fregeifier has only been tested on linux, but may work on other unix-like environments.

The Fregeifier (main branch version) requires [node](https://nodejs.org) or compatible javascript runtime, a package manager for it such as [npm](https://www.npmjs.com/), a TeX distribution such as [texlive](https://tug.org/texlive/), the [mutool](https://www.mankier.com/1/mutool) program from the MuPDF project, and of course [pandoc](https://pandoc.org) to use the pandoc filter.

To self-host the web interface, the repo contains a router for an [ExpressJS](https://expressjs.com) based server app. For more information on using the router, see [below](#using-the-interface).

## Installation

Clone this repository to a directory of your choosing (here `/path/to/repo`):

```sh
cd /path/to/repo
git clone --depth 1 https://github.com/frabjous/fregeifier
````

If permissions were not preserved in the cloning, you will need to make the pandoc filter executable:

```ah
chmod a+x /path/to/repo/fregeifier/fregeifierPandocFilter.mjs
```

## Using the pandoc filter

For background, see pandoc's documentation on [(json) filters](https://pandoc.org/filters.html).

The filter can be called using the `--filter` command line option to pandoc. For `.html` output:

```sh
pandoc --filter /path/to/repo/fregeifier/fregeifierPandocFilter.mjs \
  mydocument.md -o mydocument.html
```

For `.docx` (“MS Word”) format:

```sh
pandoc --filter /path/to/repo/fregeifier/fregeifierPandocFilter.mjs \
  mydocument.md -o mydocument.docx
```

The output format of the images will either be svg or that specified as the `--default-image-extension` option passed to pandoc. For png images, one can do:

```sh
pandoc --filter /path/to/repo/fregeifier/fregeifierPandocFilter.mjs \
  --default-image-extension=png mydocument.md -o mydocument.html
```

To use the [recommended css](#recommended-css) as well, use pandoc's `--css` option, and the `--standalone` option to include html headers. You may also wish to use `--embed-resources` to embed the css into the output itself.

```sh
pandoc --filter /path/to/repo/fregeifier/fregeifierPandocFilter.mjs \
  --css /path/to/repo/fregeifier/recommended.css --standalone \
  --embed-resources mydocument.md -o mydocument.docx
```

Currently only `svg` and `png` are supported, but this may change.

For the filter to have any effect when applied to a markdown input document, parts of the document containing either inline or block/display mathematics must be given the `.fregeify` css class, e.g.:

```markdown
Here is some inline math, like [$2 + 2 = 4$]{.fregeify},
with the class applied

Below is some display math with the class applied.

:::{.fregeify}
$$
5 + 7 = 12
$$
:::
```

These math environments will be processed by LaTeX, converted to small images, and inserted into the document at the specified places.  Mathematics environments not so marked with the `.fregeify` class should be unaffected.

Most likely, however, you don’t need to use this on boring math like “5 + 7 = 12” which can easily be rendered as regular text. The main use of the filter is to allow commands from unusual LaTeX packages. The filter will look for pandoc-compliant (yaml) metadata that adds additional LaTeX packages in the header, which typically takes the following form (at the top of your markdown file):

```markdown
---
header-includes: |
    \usepackage{grundgesetze,fge}
...
```

These packages will be available then not just if the markdown document is processed to PDF by a LaTeX engine, but also when the Fregeifier filter is used to create images.

A small complete document might look like this:

```markdown
---
header-includes: |
    \usepackage{grundgesetze,fge}
...

In Frege’s notation, a conditional is written like so:

:::{.fregeify}
\GGjudge\GGconditional{p}{q}
:::

```
Here the [LaTeX grundgesetze package](https://ctan.org/pkg/grundgesetze) is used to render Frege’s notation. Again, however, the filter is package-agnostic and may be used with any LaTeX packages, not just those for Frege’s notation.

A custom template can be used to always load certain packages for a local installation. See [below](#custom-templates).

## Recommended CSS

The `recommended.css` file is a style-sheet with settings recommended for use with the pandoc filter. This CSS can be added to the output of pandoc with its `--css` option (see above), or copied into a pandoc template. The additional classes `.top` and `.bottom` may be used to aid in the vertical positioning of inline fregeified images when combined with the `.fregeify` class, as opposed to the default middle alignment, for example.

## How it works

The LaTeX math code extracted from the block by pandoc is processed by the filter to create a minimal LaTeX document. That document is then processed by LaTeX into PDF, the PDF is cropped by the `pdfcrop` utility of TeXlive, and then `mutool` is used to convert the PDF page to the output format. The images will be placed in an `images` subdirectory of the active directory. It is usually best to run pandoc from the same directory as your source document.

## Custom templates

By default, the minimal LaTeX documents are based on the file `default-template.tex`. However, the contents of these minimal documents can be modified by using a different template.

Custom templates will be searched for in the following order.

1) The path set by environmental variable `FREGEIFIER_TEMPLATE` if non-empty.
2) The current directory using the filename `fregeifier-template.tex`.
3) `$HOME/.config/fregeifier/fregeifier-template.tex`.

If none of these are found, the default is used.

The template may also be used to change the LaTeX engine used. If the template contains (most likely in a comment), `xelatex` or `lualatex`, that command will be used instead to create the intermediate PDFs; otherwise `pdflatex` is used.

Templates must also contain comments of the following forms:

```tex
% FREGEIFIER:HEADERINCLUDES
```

and

```tex
% FREGEIFIER:MATHTEXT
```

When processing "fregeified" math, the former will be replaced by any TeX-specific `header-includes:` content, and the latter by the LaTeX code used in the math.

Templates are fussy. There must be exactly one space between the “`%`” and the “`F`”.

The file `default-template.tex` can be consulted for comparison, and/or directly copied and modified to suit one’s needs (e.g., specify different math fonts, always load certain packages, etc.)

Again, if “`xelatex`” or “`lualatex`” are found in the code (most likely in another comment), that command will be used in place of `pdflatex` to create the converted images.

## Using the web interface with the testing server

The web interface (for the main branch) is powered by a router for an [ExpressJS](https://expressjs.com) (or compatible) web-server.

There is also a testing server that can be used on its own. After [cloning the repository](#installation), the Express dependencies must be installed:

```sh
npm install
```

You can then start the testing server with:

```sh
npm run production
```

The Fregeifier web interface should now be available in a browser at this url:

```
http://localhost:10791/fregeifier
```

If you wish to use a different port you can set the environmental variable FREGEIFIERTESTSERVERPORT:

```sh
FREGEIFIERTESTSERVERPORT=8080 npm run production
```

The interface is hopefully self-explanatory for the purposes of creating images similar to those produced by the filter. Additionally, images can be created through the web interface by converting from contemporary notation.

Files created by the user will be stored in a data folder, either at `$HOME/data/fregeifier` (if it exists) or `$HOME/.cache/fregeifier` otherwise. When invoked, files older than a week stored there are removed, but presumably the user will have downloaded copies from the web page before that if they wished to make use of them.

## Adding the web interface to a different ExpressJS app

To make use of it on an a different ExpressJS-powered server, the router must be mounted in your app:

```javascript
import express from 'express';
import fregeifierRouter from '/path/to/repo/fregeifier/fregeifierRouter.mjs';

const app = express();

// pre-fregeifier routes here

// mount router
app.use(fregeifierRouter);

// post-fregeifier routes here

// …

```

Adjust as necessary. The file `test-server.mjs` provides a full example of how it might be used in an ExpressJS app, albeit one that does nothing else.

As with the testing server, files created will be stored either in `$HOME/data/fregeifier` (if it exists for the user running the express app) or `$HOME/.cache/fregeifier` otherwise. When invoked, files older than a week are removed.

The interface allows the user to create documents with arbitrary LaTeX code, so security may be a concern. `--shell-escape` and `--write18` are disabled and the number of characters in the LaTeX code is limited, but you may wish to take other measures, especially if the server is exposed to the full internet.

## Adding the web interface to a different webserver

There are two options if you wish to use the Fregeifier on a non-ExpressJS server.

First, if you are using a server that supports php, you may wish to switch to the php branch. See the [corresponding documentation](https://github.com/frabjous/fregeifier/blob/php/README.md) for that branch.

Second, you can run the testing server as described [above](#using-the-web-interface-with-the-testing-server), and then use a reverse proxy to redirect traffic to its port (10791 by default). For example, in nginx, you could include this in your configuration:

```
server {
  listen 80;
  listen [::]:80;
  server_name mydomain.net;
  location /fregeifier {
    proxy_pass http://localhost:10791;
  }
}
```

## Acknowledgements

Thanks go to the creators of tools such as the grundgesetze, fge and principia LaTeX packages, including Marcus Rossberg, J. J. Green, and Landon Elkind; the creators of pandoc, including John MacFarlane, and other contributors to the open source world.

## License

Copyright 2024 © [Kevin C. Klement](https://people.umass.edu/klement). This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).

