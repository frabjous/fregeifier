
# The Amazing Fregeifier

## Introduction

The Fregeifier is a collection of tools for rendering unusual mathematics in documents and webpages, including things such Gottlob Frege’s logical notation or that of Russell and Whitehead’s *Principia Mathematica*. It is not limited to those, but may be used for any other kind of complex or unusual mathematical symbolism/notation for which LaTeX tools already exist, but are otherwise hard to use outside of LaTeX-produced documents.

Possibly more will come, but currently there are two main tools.

1) A filter for [pandoc](https://pandoc.org) that allows you to select a subset of LaTeX-coded mathematics in a markdown document, which, when converted to a non-LaTeX format, such as `.docx`, `.html` or `.epub`, will be rendered as (scalable) images created by converting the output of processing the mathematics by means of a full-featured LaTeX engine. Hence, you can leverage existing tools for things like Frege’s notation, and other LaTeX goodies.

    The filter was originally developed for [The Journal for the History of Analytical Philosophy](https://jhaponline.org) and integrates easily with the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) and [Open Guide Editor](https://github.com/frabjous/open-guide-editor) it uses, which I also created, though it may be used independently.

2) A web interface that can be used to create, preview and download (scalable) images stemming from arbitrary LaTeX code, including that which makes use of unusual packages such as the [grungesetze](https://ctan.org/pkg/grundgesetze?lang=en) or [fge](https://ctan.org/pkg/fge) packages for Frege’s notation, the [principia](https://ctan.org/pkg/principia?lang=en) package for Russell and Whitehead’s, or any other LaTeX packages available in TeXlive.

    A live, hopefully working, version of the web interface can be found here: [https://russellguide.org/fregeifier](https://russellguide.org/fregeifier).

## Requirements

The Fregeifier has only been tested on linux, but may work on other unix-like environments.

The Fregeifier requires [php](https://www.php.net/), a TeX distribution such as [texlive](https://tug.org/texlive/), the [mutool](https://www.mankier.com/1/mutool) program from the MuPDF project, and of course [pandoc](https://pandoc.org) to use the pandoc filter.

To self-host the web interface, a PHP-enabled web server (apache, nginx, caddy, etc.) must be available.

## Installation

Clone this repository to a directory of your choosing (here `/path/to/repos`):

```sh
cd /path/to/repos
git clone --depth 1 https://github.com/frabjous/fregeifier
````

If you want to self-host the web interface, it would be best to clone the repository into a directory to be served by the php-enabled server.

If permissions were not preserved in the cloning, you will need to make the pandoc filter executable:

```ah
chmod a+x /path/to/repos/fregeifier/fregeifier_pandoc_filter.php
```

## Using the pandoc filter

For background, see pandoc’s documentation on [(json) filters](https://pandoc.org/filters.html).

The filter can be called using the `--filter` command line option to pandoc. For `.html` output:

```sh
pandoc --filter /path/to/repos/fregeifier/fregeifier_pandoc_filter.php \
    mydocument.md -o mydocument.html
```

For `.docx` (“MS Word”) format:

```sh
pandoc --filter /path/to/repos/fregeifier/fregeifier_pandoc_filter.php \
    mydocument.md -o mydocument.docx
```

The output format of the images will either be svg or that specified as the `--default-image-extension` option passed to pandoc. For png images, one can do:

```sh
pandoc --filter /path/to/repos/fregeifier/fregeifier_pandoc_filter.php \
    --default-image-extension=png mydocument.md -o mydocument.html
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

Most likely, however, you don’t need to use this on boring math like “5 + 7 = 12” which can easily be rendered as regular text. The main use of the filter is to be able to call upon commands from unusual LaTeX packages. The filter will look for pandoc-compliant (yaml) metadata in the document containing code to include additional LaTeX packages in the header, which typically takes the following form:

```markdown
---
header-includes: |
    \usepackage{grundgesetze,fge}
...
```

These packages will be available then not just if the markdown document is processed to PDF by a LaTeX engine, but also when the filter creates the small images.

So a small complete document might look like this:

```markdown
---
header-includes: |
    \usepackage{grundgesetze,fge}
...

In Frege’s notation, a conditional is written as so:

:::{.fregeify}
\GGjudge\GGconditional{p}{q}
:::

```
Here the [LaTeX grundgesetze package](https://ctan.org/pkg/grundgesetze?lang=en) is used to render Frege’s notation. Again, however, the filter is package-agnostic and may be used with any LaTeX packages, not just those for Frege’s notation.

A custom template can be used to always load certain packages for a local installation. See [below](#custom-templates).

## Recommended CSS

The `recommended.css` file is a stylesheet with settings recommended for use with the pandoc filter. This CSS can be added to the output of pandoc with its `--css` option, or copied into a pandoc template. The additional classes `.top` and `.bottom` may be used to aid in the vertical positioning of inline fregeified images when combined with the `.fregeify` class, as opposed to the default middle alignment, for example.

## How it works

The LaTeX math code extracted from the environment by pandoc is processed by the filter to create a minimal LaTeX document. That document is then processed by LaTeX into PDF, the PDF is cropped by the `pdfcrop` utility of TeXlive, and then `mutool` is used to convert the PDF page to the output format. The images will be placed in an `images` subfolder of the active directory. It is usually best to run pandoc from the same directory as your source document.

## Custom templates

By default, the minimal LaTeX documents are based on the file `default-template.tex`. However, the contents of these minimal documents can be modified by using a different template.

Custom templates will be searched for in the following order.

1) The path set by environmental variable `FREGEIFIER_TEMPLATE` if non-empty.
2) The current directory using the filename `fregeifier-template.tex`.
3) `$HOME/.config/fregeifier/fregeifier-template.tex`.

If none of these are found, the default is used.

The template may also be used to change the LaTeX engine used. If the template contains (most likely in a comment), `xelatex` or `lualatex`, they will be used instead to create the intermediate PDFs; otherwise `pdflatex` is used.

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

The file `default-template.tex` can be consulted for comparison, and/or directly copied and modified to suits one’s needs (e.g., specify different math fonts, always load certain packages, etc.)

Moreover, if “`xelatex`” or “`lualatex`” are found in the code (most likely in another comment), they will be used in place of `pdflatex` to create the converted images.

## Using the web interface

If the repository is cloned into a directory served by a PHP-enabled web server, the web interface should be accessible through the url for the repository directory, e.g., `http(s)://yourdomain.net/fregeifier/`.

PHP was chosen as the programming language to make setting up the web interface easy.

The interface is hopefully self-explanatory for the visitor for the purposes of creating images similar to those produced by the filter. Additionally, images can be created through the web interface by converting from contemporary notation.

The same tools necessary for the filter must be installed. Files created by the user will be stored in a data folder, either at `../../data/fregeifier` relative to the repository directory (if it exists) or `$HOME/.cache/fregeifier` otherwise. Whenever invoked, files older than a day will be removed.

The interface allows the user to create documents with arbitrary LaTeX code, so security may be a concern. `--shell-escape` and `--write18` are disabled and the number of characters in the LaTeX code is limited, but you may wish to take other measures, especially if the server is exposed to the full internet.

## Roadmap and TODO

More is planned!

- [x] pandoc filter
- [x] basic web interface
- [x] add widget on web interface for converting ordinary notation to the LaTeX code for Frege’s
- [ ] create javascript and javascript api for loading Fregeified images in a manner similar to that of KaTeX or MathJax.

## Acknowledgements

Thanks go to the creators of tools such as the grundgesetze, fge and principia LaTeX packages, including Marcus Rossberg, J. J. Green, and Landon Elkind; the creators of Pandoc, including John MacFarlane, and other contributors to the open source world.

## License

Copyright 2024 © [Kevin C. Klement](https://people.umass.edu/klement). This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).

