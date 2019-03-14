// @flow
import * as React from "react";
import Router from "next/router";
import NextLink from "next/link";
import { trim } from "lodash";

import { theme } from "../theme";

// Convert simple links to next style href + as
const Link = ({ to, children, basepath }) => (
  <NextLink
    href={{ pathname: "/view", query: { viewPath: to } }}
    as={basepath + "/" + to}
  >
    {children}
  </NextLink>
);

// The HideCodeButton toggles the visibility of notebook input and stderr cells
class HideCodeButton extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleClick = this.handleClick.bind(this);

    this.state = {
      isHidden: false
    };
  }

  handleClick() {
    // code inputs
    const inputs = Array.from(document.getElementsByClassName('input'));
    // error logs
    const errs = Array.from(document.getElementsByClassName('nteract-display-area-stderr'));
    const objs = inputs.concat(errs)
    // toggle visibility
    if (this.state.isHidden) {
      this.setState({ isHidden: false})
      objs.forEach((obj) => obj.style.display = '');
    } else {
      this.setState({ isHidden: true})
      objs.forEach((obj) => obj.style.display = 'none');
    }
  }

  render() {
    const { isHidden } = this.state;

    return (
      <button
        id="hide-code"
        className="ops"
        onClick={this.handleClick}
      >
        {isHidden ? 'Show Code' : 'Hide Code'}
      </button>
    );
  }
}

class BrowseHeader extends React.Component<*> {
  props: {
    path: string,
    basepath: string,
    type: string,
    commuterExecuteLink: ?string
  };

  static defaultProps = {
    active: "view"
  };

  handleItemClick = (e: SyntheticEvent<*>, { name }: { name: string }) => {
    Router.push(name);
  };

  render() {
    const { path, basepath } = this.props;
    let paths = trim(path, "/").split("/");
    // Empty path to start off
    if (paths.length === 1 && paths[0] === "") {
      paths = [];
    }

    // TODO: Ensure this works under an app subpath (which is not implemented yet)
    const filePath = basepath.replace(/view\/?/, "files/") + path;

    // const serverSide = typeof document === "undefined";
    const viewingNotebook = filePath.endsWith(".ipynb");

    // TODO: Removed styled-jsx because of JS errors
    // But that impacts the header style a bit
    return (
      <nav>
        <ul className="breadcrumbs">
          <li>
            <Link to={``} basepath={basepath}>
              <a>
                <span>home</span>
              </a>
            </Link>
          </li>
          {paths.map((name, index) => {
            const filePath = paths.slice(0, index + 1).join("/");
            return (
              <li key={`${filePath}`}>
                <Link to={`${filePath}`} basepath={basepath}>
                  <a>
                    <span>{name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
        {this.props.type === "directory" ? null : (
          <React.Fragment>
            {this.props.commuterExecuteLink && viewingNotebook ? (
              <a
                href={`${this.props.commuterExecuteLink}/${path}`}
                className="ops"
              >
                Run
              </a>
            ) : null}
            <HideCodeButton></HideCodeButton>
            <a href={filePath} download className="ops">
              Download
            </a>
          </React.Fragment>
        )}
        <style>{`
          nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid ${theme.outline};
            padding: 0 1rem;
          }
          ul.breadcrumbs {
            display: flex;
            position: relative;

            margin: 0 0 0 0;
            padding: 0;

            list-style: none;
            background: #ffffff;
            font-family: "Source Sans Pro";
            font-size: 16px;
            color: ${theme.primary};
          }

          ul.breadcrumbs li {
            flex-direction: row;
            list-style-type: none;
            display: inline;
            text-align: center;
            display: flex;
            align-items: center;
          }

          ul.breadcrumbs li a {
            vertical-align: middle;
            display: table;
            padding: 1em;
            color: ${theme.primary};
            text-decoration: none;
          }

          ul.breadcrumbs li a:hover {
            text-decoration: underline;
          }

          ul.breadcrumbs li:last-child a {
            color: ${theme.active};
            text-decoration: none;
            cursor: pointer;
          }

          ul.breadcrumbs li + li:before {
            content: "›";
            color: ${theme.active};
          }

          .ops {
            display: inline-block;
            line-height: 2em;
            padding: 0 8px;
            border-radius: 2px;
            background-color: ${theme.background};
            border: 1px solid ${theme.outline};
            color: #000;
            text-decoration: none;
          }

          .ops:hover {
            background-color: ${theme.outline};
            transition: background-color 0.25s ease-out;
          }

          .ops:active {
            background-color: ${theme.primary};
            color: ${theme.active};
            transition: background-color 0.5s ease-out, color 6s ease-out;
          }

          .ops:not(:last-child) {
            margin-right: 10px;
          }

          #hide-code {
            white-space: nowrap;
            margin-left: 10px;
          }
        `}</style>
      </nav>
    );
  }
}

export default BrowseHeader;
