
# The Amazing Fregeifier

The Fregeifier is a collection of tools for rendering unusual mathematics in documents and webpages, including things such Gottlob Frege’s logical notation or that of Russell and Whitehead’s *Principia Mathematica*.

It is currently early in development. What has been finished so far is an early version of a filter for [pandoc](https://pandoc.org) that allow only a selected subset of LaTeX-coded mathematics environments in a markdown document converted to HTML or an HTML-based format to be rendered as images created by converting the output of processing the mathematics by means of a LaTeX engine. See the roadmap below for additional planned features.

The name of the project, and its initial use case, involved easy inclusion of Gottlob Frege's logical notation making use of the existing LaTeX tooling in non-LaTeX based documents. However, the Fregeifier is not limited to Frege notation, but can be used for any complex math environments for which LaTeX tools exist but cannot be currently handled by pandoc by itself.

## Requirements

The Fregeifier has only been tested on linux, but may work on other unix-like environments.

The Fregeifier requires [php](https://www.php.net/), a TeX distribution such as [texlive](https://tug.org/texlive/), the [mutool](https://www.mankier.com/1/mutool) program from the MuPDF project, and of course [pandoc](https://pandoc.org) to use the pandoc filter.

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


## License

Copyright 2024 © [Kevin C. Klement](https://people.umass.edu/klement). This is free software, which can be redistributed and/or modified under the terms of the [GNU General Public License (GPL), version 3](https://www.gnu.org/licenses/gpl.html).

A big thank you to John MacFarlane and the other pandoc developers.

