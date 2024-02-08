
# The Amazing Fregeifier

## Introduction

The Fregeifier is a collection of tools for rendering unusual mathematics in documents and webpages, including things such Gottlob Frege’s logical notation or that of Russell and Whitehead’s *Principia Mathematica*.

It is currently early in development. What has been finished so far is an early version of a filter for [pandoc](https://pandoc.org) that allow only a selected subset of LaTeX-coded mathematics in a markdown document, when converted to HTML or an HTML-based format, to be rendered as images created by converting the output of processing the mathematics by means of a LaTeX engine. See the [roadmap](#roadmap-and-todo) below for additional planned features.

The name of the project came from the need for easy inclusion of Gottlob Frege's logical notation in non-LaTeX based documents, but by means of making use of the existing LaTeX tooling. However, the Fregeifier is not limited to Frege notation, but can be used for any complex math environments for which LaTeX tools exist, but cannot be currently handled directly by programs such as pandoc as is.

It was originally developed for [The Journal for the History of Analytical Philosophy](https://jhaponline.org) and integrates easily with the [Open Guide Typesetting Framework](https://github.com/frabjous/open-guide-typesetting-framework) and [Open Guide Editor](https://github.com/frabjous/open-guide-typesetting-framework) it uses, which I also created, though it may be used independently.

## Requirements

The Fregeifier has only been tested on linux, but may work on other unix-like environments.

The Fregeifier requires [php](https://www.php.net/), a TeX distribution such as [texlive](https://tug.org/texlive/), the [mutool](https://www.mankier.com/1/mutool) program from the MuPDF project, and of course [pandoc](https://pandoc.org) to use the pandoc filter.

A big thanks to the developers of all these (open source) tools.

## Installation

Clone this repository to a directory of your choosing (here `/path/to/repos`):

```sh
cd /path/to/repos
git clone --depth 1 https://github.com/frabjous/fregeifier
````

If permissions were not preserved in the cloning, you will need to make the pandoc filter executable:

```ah
chmod a+x /path/to/repos/fregeifier/fregeifier_pandoc_filter.php
```

## Using the pandoc filter

For background, see pandoc’s documentation on [(json) filters](https://pandoc.org/filters.html).

The filter can be called using the `--filter` command line option to pandoc, e.g.:

```sh
pandoc --filter /path/to/repos/fregeifier/fregeifier_pandoc_filter.php \
    mydocument.md -o mydocument.html
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

Templates are fussy. There must be exactly one space between the `%` and the words in the template.

The file `default-template.tex` can be consulted for comparison, and/or directly copied and modified to suits one’s needs (e.g., specify different math fonts, etc.)

## Roadmap and TODO

Eventually, the Fregeifier should offer more than just a pandoc filter.

It should also make it easy to use to create images compatible with inclusion in other file formats, such as `.docx`, `.odt` and similar.

Eventually, I hope to create a web interface for download such images, and a mechanism for inserting complex or unusual mathematics into webpages just with a url, or some javascript insertion. This should supplement tools such as MathJaX, KaTeX, etc., but be able to handle all possible LaTeX code, not just what is supported by more limited tools.

## License

Copyright 2024 © [Kevin C. Klement](https://people.umass.edu/klement). This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).

