// @flow
import * as React from "react";
import NotebookPreview from "@nteract/notebook-preview";
import Markdown from "@nteract/markdown";
import { Styles, Source } from "@nteract/presentational-components";
import {
  standardTransforms,
  standardDisplayOrder,
  registerTransform
} from "@nteract/transforms";
import { VegaLite1, VegaLite2, Vega2, Vega3 } from "@nteract/transform-vega";
// import DataResourceTransform from "@nteract/transform-dataresource";

import { PlotlyNullTransform, PlotlyTransform } from "../../transforms";

import DirectoryListing from "./directory-listing";
import HTMLView from "./html";
import JSONView from "./json";
import CSVView from "./csv";

const jquery = require("jquery");

// HACK: Temporarily provide jquery for others to use...
global.jquery = jquery;
global.$ = jquery;

// Order is important here. The last transform in the array will have order `0`.
const { transforms, displayOrder } = [
  // DataResourceTransform,
  PlotlyNullTransform,
  PlotlyTransform,
  VegaLite1,
  VegaLite2,
  Vega2,
  Vega3
].reduce(registerTransform, {
  transforms: standardTransforms,
  displayOrder: standardDisplayOrder
});

const suffixRegex = /(?:\.([^.]+))?$/;


// Use NewNotebookPreview to replace NotebookPreview
// so that the we can use the JS in componentDidMount to override elements
class NewNotebookPreview extends React.Component<*> {
  componentDidMount () {
      const script = document.createElement("script");
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = `
      // Remove all vertical scroll bars from cell_displays
      displays = Array.from(document.getElementsByClassName('cell_display'));
      displays.forEach((display) => {
        display.style.maxHeight = '100%';
        display.style.overflowY = 'hidden';
      });

      // toggle button text (- / +) and cell visibility
      function toggleCell(btn, cell) {
        divs = Array.from(cell.getElementsByTagName('div'))
        if (btn.textContent == '-') { // hide
          btn.textContent = '+'
          divs.forEach((div) => div.style.display = "none");
        } else { // unhide
          btn.textContent = '-'
          divs.forEach((div) => div.style.display = "");
        }
      };

      // Add toggle button to each cell
      cells = Array.from(document.getElementsByClassName('cell'));
      cells.forEach((cell) => {
        var btn = document.createElement("BUTTON");
        var t = document.createTextNode("-");
        btn.appendChild(t);
        btn.onclick = () => toggleCell(btn, cell);
        var contentCell = cell.getElementsByTagName('div')[0];
        cell.insertBefore(btn, contentCell)
      });

      // Click the hide code button so that code is hidden by default
      hideCodeButton = document.getElementById('hide-code');
      hideCodeButton.click();`
      document.body.appendChild(script);
  }

  render() {
    // render the original NotebookPreview
    return (
        <NotebookPreview
          notebook={this.props.notebook}
          displayOrder={this.props.displayOrder}
          transforms={this.props.transforms}
        />
      )
  }
}

class File extends React.Component<*> {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    const name = this.props.entry.name;
    const presuffix = suffixRegex.exec(name);

    if (!presuffix) {
      return null;
    }

    const suffix = (presuffix[1] || "").toLowerCase();

    switch (suffix) {
      case "html":
        return <HTMLView entry={this.props.entry} />;
      case "json":
        return <JSONView entry={this.props.entry} />;
      case "csv":
        return <CSVView entry={this.props.entry} />;
      case "md":
      case "markdown":
      case "rmd":
        return <Markdown source={this.props.entry.content} />;
      case "js":
        return (
          <Source language="javascript">{this.props.entry.content}</Source>
        );
      case "py":
      case "pyx":
        return <Source language="python">{this.props.entry.content}</Source>;
      case "gif":
      case "jpeg":
      case "jpg":
      case "png":
        return (
          <img
            src={`/files/${this.props.pathname}`}
            alt={this.props.pathname}
          />
        );
      default:
        if (this.props.entry.format === "text") {
          return (
            <Source language="text/plain">{this.props.entry.content}</Source>
          );
        }
        return <a href={`/files/${this.props.pathname}`}>Download raw file</a>;
    }
  }
}

type EntryProps = {
  entry: JupyterApi$Content,
  pathname: string,
  basepath: string
};

export const Entry = (props: EntryProps) => {
  if (props.entry.content === null) {
    return null;
  }

  switch (props.entry.type) {
    case "directory":
      // Dynamic type check on content being an Array
      if (Array.isArray(props.entry.content)) {
        return (
          <DirectoryListing contents={props.entry.content} basepath={"/view"} />
        );
      }
      return null;
    case "file":
      // TODO: Case off various file types (by extension, mimetype)
      return <File entry={props.entry} pathname={props.pathname} />;
    case "notebook":
      // Using NewNotebookPreview in place of NotebookPreview
      return (
        <Styles>
          <NewNotebookPreview
            notebook={props.entry.content}
            displayOrder={displayOrder}
            transforms={transforms}
          />
        </Styles>
      );
    default:
      return <pre>{JSON.stringify(props.entry.content)}</pre>;
  }
};
